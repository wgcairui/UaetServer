<template>
  <my-page :title="title">
    <template v-slot:nav>
      <my-nav />
    </template>
    <!-- body-head -->
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
          <b-button variant="info" @click="$bvModal.show('OprateInstructMode')">操作</b-button>
          <b-button variant="info" :to="{name:'uart-setup',query:query}">配置</b-button>
        </b-button-group>
      </separated>
      <dev-table :query="query" :tableData="items"></dev-table>
    </b-row>
    <!-- 操作指令 -->
    <my-oprate :query="query" id="OprateInstructMode"></my-oprate>
  </my-page>
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
      ShowTags: [] as string[]
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
      update: data => data.ShowTags.ShowTag
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