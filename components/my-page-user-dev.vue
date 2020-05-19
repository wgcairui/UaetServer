<template>
  <my-page-user :title="title">
    <b-row class="m-0">
      <separated :title="query.DevMac">
        <b>{{Data ? new Date(Data.time).toLocaleString():''}}</b>
      </separated>
      <slot />
    </b-row>
    <!-- body-table -->
    <b-row>
      <separated title="模拟量">
        <b-button-group size="sm" class="m-2">
          <b-button variant="info" @click="$bvModal.show('OprateInstructMode')">快捷指令</b-button>
          <b-button variant="info" :to="{name:'uart-setup',query:query}">用户配置</b-button>
        </b-button-group>
      </separated>
      <b-overlay :show="$apollo.loading" class="w-100">
        <b-tabs justified>
          <b-tab title="模拟量">
            <b-table :items="line.simulate" :fields="fields">
              <template v-slot:cell(value)="row">
                <b class="value">
                  <b-badge>{{row.value}}</b-badge>
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
            <b-table :items="line.quantity" :fields="fields"></b-table>
          </b-tab>
        </b-tabs>
      </b-overlay>
    </b-row>
    <!-- 操作指令 -->
    <my-oprate :query="query" id="OprateInstructMode"></my-oprate>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResultSave,
  ProtocolConstantThreshold,
  queryResultArgument
} from "../server/bin/interface";
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
      ] as BvTableFieldArray
    };
  },
  //
  computed: {
    // 从设备数据中刷选出用户指定的参数值
    items() {
      const Data = this.Data as queryResultSave;
      const ShowTags = this.ShowTags as string[];
      if (ShowTags && ShowTags.length > 0 && Data?.result) {
        Data.result = Data.result.filter(el => ShowTags.includes(el.name));
      }
      return Data;
    },
    //
    line() {
      // 状态量
      const quantity: queryResultArgument[] = [];
      // 模拟量
      const simulate: queryResultArgument[] = [];
      if (this.Data?.result) {
        const Data = this.Data as queryResultSave;
        // 空调设备数据
        const result: queryResultArgument[] = Data.result;
        result.forEach(el => {
          const valGetter: queryResultArgument = (this
            .$store as any).getters.getUnit(el);
          valGetter.issimulate
            ? simulate.push(valGetter)
            : quantity.push(valGetter);
        });
      }
      return { simulate, quantity };
    }
  },
  apollo: {
    // 设备数据
    Data: {
      query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          Data: UartTerminalData(DevMac: $DevMac, pid: $pid) {
            result {
              name
              value
              unit
            }
            parse
            pid
            time
            mac
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
    }
  }
});
</script>
<style lang="scss" scoped>
.value {
  font-size: 1.3rem;
}
</style>