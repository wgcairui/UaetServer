<template>
  <div>
    <b-row class="m-0">
      <separated :title="query.mountDev">
        <b
          v-b-tooltip.hover
          :title="Queryarg.useTime + '/' + Queryarg.Interval"
        >{{ Queryarg.queryTime }}</b>
      </separated>
      <b-col>
        <ths v-if="DevConstant.ProtocolType === 'th'" :dev="Data" :Constant="DevConstant" />
        <ups v-if="DevConstant.ProtocolType === 'ups'" :dev="Data" :Constant="DevConstant" />
        <air v-if="DevConstant.ProtocolType === 'air'" :dev="Data" :Constant="DevConstant" />
        <ems v-if="DevConstant.ProtocolType === 'em'" :dev="Data" :Constant="DevConstant" />
      </b-col>
    </b-row>

    <b-row>
      <separated title="模拟量">
        <b-button-group size="sm" class="m-2">
          <b-button variant="info" @click="$bvModal.show('OprateInstructMode')">快捷指令</b-button>
          <b-button variant="info" :to="{ name: 'main-protocolSetup', query: query }">用户配置</b-button>
          <b-button v-if="devTimeOut" variant="info" @click="refreshDev(query)">超时重置</b-button>
        </b-button-group>
      </separated>
      <b-overlay :show="$apollo.loading" class="w-100 px-2">
        <b-tabs justified>
          <b-tab title="模拟量">
            <b-table :items="line.simulate" :fields="fields" :tbody-tr-class="rowClass" class>
              <template v-slot:cell(value)="row">
                <b class="value">
                  <b-badge>{{ parseFloat(row.value) }}</b-badge>
                </b>
                <span>{{ row.item.unit }}</span>
              </template>
              <template v-slot:cell(oprate)="row">
                <b-button-group size="sm" v-if="row.item.unit">
                  <b-button
                    variant="info"
                    class="block px-1 py-0 pt-1"
                    :to="{ name: 'main-line', query: { ...$route.query, name: row.item.name }}"
                  >趋势</b-button>
                  <!-- <b-button @click="AlarmArgument(row.item)" variant="info">Alarm</b-button> -->
                </b-button-group>
              </template>
            </b-table>
          </b-tab>
          <b-tab title="状态量" lazy v-if="line.quantity.length > 0">
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
import { queryResultSave, ProtocolConstantThreshold, queryResultArgument } from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      query: {},
      Data: {} as queryResultSave,
      DevConstant: { ProtocolType: '' } as ProtocolConstantThreshold,
      ShowTags: [] as string[],
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      // 设备是否在超时状态
      devTimeOut: false
    };
  },
  /* 
  使用watchQuery属性可以监听参数字符串的更改。 如果定义的字符串发生变化，将调用所有组件方法(asyncData, fetch, validate, layout, ...)。 为了提高性能，默认情况下禁用。
  */
  watchQuery: true,
  async asyncData({ app, query }) {
    const client = app.apolloProvider.defaultClient;
    const ShowTags = await client.query({
      query: gql`
        query getUserDevConstant($Protocol: String) {
          ShowTags: getUserDevConstant(Protocol: $Protocol) {
            ShowTag
          }
        }
      `,
      variables: { Protocol: query.protocol }
    });

    const DevConstant = await client.query({
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
      variables: { Protocol: query.protocol }
    });
    // console.log({ query, DevConstant: DevConstant.data.DevConstant, ShowTags: ShowTags.data });
    return { query, DevConstant: DevConstant.data.DevConstant, ShowTags: ShowTags.data.ShowTags?.ShowTag || [] };
  },
  //
  computed: {
    // 从设备数据中刷选出用户指定的参数值
    line() {
      // 状态量
      const quantity: queryResultArgument[] = [];
      // 模拟量
      const simulate: queryResultArgument[] = [];
      const Data = this.Data as queryResultSave;
      const ShowTags = this.ShowTags as string[];
      if (Data?.parse) {
        const parse = Object.values(Data.parse)
        const result = ShowTags.length > 0 ? parse.filter(el => ShowTags.includes(el.name)) : parse
        result.forEach(el => {
          const valGetter: queryResultArgument = this.$store.getters.getUnit(el);
          if (valGetter.issimulate) simulate.push(valGetter)
          else quantity.push(valGetter);
        });
      }
      // console.log({ simulate, quantity, Data, ShowTags });

      return { simulate, quantity };
    },
    // 查询耗时和查询间隔
    Queryarg() {
      const Data = this.Data as queryResultSave;
      const time = { queryTime: "", useTime: 0, Interval: 0 };
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
        const { pid, DevMac } = this.$data.query;
        return { pid: parseInt(pid), DevMac };
      },
      // fetchPolicy: "network-only",
      pollInterval: 2000
    },

    // 设备超时状态
    devTimeOut: {
      query: gql`
        query checkDevTimeOut($mac: String, $pid: String) {
          devTimeOut: checkDevTimeOut(mac: $mac, pid: $pid)
        }
      `,
      variables() {
        return { mac: this.$data.query.DevMac, pid: String(this.$data.query.pid) };
      },
      pollInterval: 30000
    }
  },
  methods: {
    rowClass(item: queryResultArgument, type: string) {
      if (!item || type !== "row") return;
      if (item.alarm) return "table-danger";
      return;
    },
    async refreshDev(query: any) {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation refreshDevTimeOut($mac: String, $pid: String) {
            refreshDevTimeOut(mac: $mac, pid: $pid) {
              ok
            }
          }
        `,
        variables: { mac: query.DevMac, pid: String(query.pid) }
      });
      this.$bvModal.msgBoxOk("重置完成", { title: "msg" });
    }
  }
});
</script>
<style lang="scss" scoped>
.value {
  font-size: 1.3rem;
}
</style>