<template>
  <my-page :title="title">
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
          <b-button variant="info" v-b-modal.OprateInstructMode>操作</b-button>
          <b-button variant="info" :to="{name:'uart-setup',query:query}">配置</b-button>
        </b-button-group>
      </separated>
      <dev-table :query="query" :tableData="Data"></dev-table>
    </b-row>
    <!-- 操作指令 -->
    <b-modal
      size="lg"
      title="指令操作"
      id="OprateInstructMode"
      ok-only
      button-size="sm"
      ok-title="关闭"
      ok-variant="default"
    >
      <my-oprate :query="query"></my-oprate>
    </b-modal>
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
      >
    };
  },
  apollo: {
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
      pollInterval: 2000,
      result: function(data) {
        this.$emit("data", data.data.Data);
      }
    },
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
            }
          }
        }
      `,
      variables() {
        return {
          Protocol: this.query.protocol
        };
      },
      result: function(data) {
        this.$emit("constant", data.data.DevConstant);
      }
    }
  }
});
</script>