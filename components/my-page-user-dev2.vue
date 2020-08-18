<template>
  <div>
    <b-row class="m-0">
      <separated :title="query.mountDev">
        <b v-b-tooltip.hover :title="Queryarg.useTime+'/'+Queryarg.Interval">{{Queryarg.queryTime}}</b>
      </separated>
      <slot />
    </b-row>

    <b-row>
      <separated title="模拟量">
        <b-button-group size="sm" class="m-2">
          <b-button variant="info" @click="$bvModal.show('OprateInstructMode')">快捷指令</b-button>
          <b-button variant="info" :to="{name:'main-setup',query:query}">用户配置</b-button>
          <b-button v-if="devTimeOut" variant="info" @click="refreshDev(query)">超时重置</b-button>
        </b-button-group>
      </separated>
      <b-overlay :show="$apollo.loading" class="w-100 px-2">
        <b-tabs justified>
          <b-tab title="模拟量">
            <b-table :items="line.simulate" :fields="fields" :tbody-tr-class="rowClass" class>
              <template v-slot:cell(value)="row">
                <b class="value">
                  <b-badge>{{parseFloat(row.value)}}</b-badge>
                </b>
                <span>{{row.item.unit}}</span>
              </template>
              <template v-slot:cell(oprate)="row">
                <b-button-group size="sm" v-if="row.item.unit">
                  <b-button
                    variant="info"
                    class="block px-1 py-0 pt-1"
                    :to="{
                        name: 'uart-line',
                        query: { ...$route.query, name: row.item.name }
                      }"
                  >趋势</b-button>
                  <!-- <b-button @click="AlarmArgument(row.item)" variant="info">Alarm</b-button> -->
                </b-button-group>
              </template>
            </b-table>
          </b-tab>
          <b-tab title="状态量" lazy v-if="line.quantity.length>0">
            <b-table :items="line.quantity" :fields="fields" :tbody-tr-class="rowClass"></b-table>
          </b-tab>
        </b-tabs>
      </b-overlay>
    </b-row>

    <my-oprate :query="query" id="OprateInstructMode"></my-oprate>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResultSave,
  ProtocolConstantThreshold,
  queryResultArgument
} from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  props: {
    title: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      default: { mountDev: "", pid: "", protocol: "", DevMac: "" },
      required: true
    }
  },
  data() {
    return {
      Data: {} as queryResultSave,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "Constant"
      >,
      ShowTags: [] as string[],
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      // 设备是否在超时状态
      devTimeOut:false
    };
  },
  //
  computed: {
    querys(){
      let a = this.query
      console.log(a);
      return a
    },
    // 从设备数据中刷选出用户指定的参数值
    line() {
      // 状态量
      const quantity: queryResultArgument[] = [];
      // 模拟量
      const simulate: queryResultArgument[] = [];
      const Data = this.Data as queryResultSave;
      const ShowTags = this.ShowTags as string[];
      if (Data?.parse) {
        let result = Object.values(Data.parse);
        if (ShowTags && ShowTags.length > 0) {
          result = result.filter(el => ShowTags.includes(el.name));
        }
        //
        result.forEach(el => {
          const valGetter: queryResultArgument = (this
            .$store as any).getters.getUnit(el);
          valGetter.issimulate
            ? simulate.push(valGetter)
            : quantity.push(valGetter);
        });
      }
      return { simulate, quantity };
    },
    // 查询耗时和查询间隔
    Queryarg() {
      const Data = this.Data as queryResultSave;
      const time = {
        queryTime: "",
        useTime: 0,
        Interval: 0
      };
      if (Data?.parse) {
        time.useTime = Data.useTime;
        time.Interval = Data.Interval;
        time.queryTime = new Date(Data.time).toLocaleString();
        this.$apollo.queries.Data.startPolling(time.Interval);
      }
      return time;
    }
  },
  apollo: {
    // 设备数据
    Data: {
      query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          Data: UartTerminalData(DevMac: $DevMac, pid: $pid) {
            parse
            pid
            time
            mac
            Interval
            useTime
          }
        }
      `,
      variables() {
        const { pid, DevMac } = this.query;
        return {
          pid: parseInt(pid),
          DevMac
        };
      },
      // fetchPolicy: "network-only",
      pollInterval: 2000,
      result: function(data) {
        this.$emit("data", data.data.Data);
      }
    },
    //
    // 用户配置
    ShowTags: {
      query: gql`
        query getUserDevConstant($Protocol: String) {
          ShowTags: getUserDevConstant(Protocol: $Protocol) {
            ShowTag
          }
        }
      `,
      variables() {
        return { Protocol: this.query.protocol };
      },
      update: data => data.ShowTags?.ShowTag || []
    },
    // 系统配置
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ProtocolType
            Constant {
              UPSModels
              BatteryTemperature
              ResidualCapacity
              BatteryVoltage
              OutputFrequency
              OutputLoad
              #
              Temperature
              Humidity
              #
              HeatChannelTemperature
              HeatChannelHumidity
              ColdChannelTemperature
              ColdChannelHumidity
              RefrigerationTemperature
              RefrigerationHumidity
              Speed
              HeatModel
              ColdModel
              Dehumidification
              Humidification
            }
          }
        }
      `,
      variables() {
        return {
          Protocol: this.query.protocol
        };
      },
      // fetchPolicy: "network-only",
      result: function(data) {
        this.$emit("constant", data.data.DevConstant);
      }
    },
    // 设备超时状态
    devTimeOut:{
      query:gql`
      query checkDevTimeOut($mac:String,$pid:String){
        devTimeOut:checkDevTimeOut(mac:$mac,pid:$pid)
      }
      `,
      variables(){
        return{
          mac:this.query.DevMac,
          pid:String(this.query.pid)
        }
      },
      pollInterval:10000
    }
  },
  methods: {
    rowClass(item: queryResultArgument, type: string) {
      if (!item || type !== "row") return;
      if (item.alarm) return "table-danger";
      return;
    },
    async refreshDev(query:any){
      // console.log(query);
      const result = await this.$apollo.mutate({
        mutation:gql`
        mutation refreshDevTimeOut($mac:String,$pid:String){
          refreshDevTimeOut(mac:$mac,pid:$pid){
            ok
          }
        }
        `,
        variables:{
          mac:query.DevMac,
          pid:String(query.pid)
        }
      })
      this.$bvModal.msgBoxOk("重置完成",{title:"msg"})
    }
  }
});
</script>
<style lang="scss" scoped>
.value {
  font-size: 1.3rem;
}
</style>