<template>
  <my-page title="UPS">
    <b-row class="m-0">
      <separated :title="query.DevMac">
        <b>{{EmData ? new Date(EmData.time).toLocaleString():''}}</b>
      </separated>
      <b-col cols="12" md="8" class="m-0 p-0 my-2">
        <b-card :sub-title="betty_model.name">
          <b-card-body>
            <b-img :src="betty_model.src" class="mw-100"></b-img>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col cols="12" md="4" class="m-0 p-0 my-2">
        <b-card class="mx-2 h-100">
          <b-card-title>
            电池状态
            <b-button class="float-right" size="sm" variant="info" v-b-modal.OprateInstructMode>操作</b-button>
          </b-card-title>
          <b-card-body>
            <div
              class="border p-2 shadow-sm rounded-lg my-2"
              v-for="val in betty_stat"
              :key="val.name"
            >
              <h5 class="m-0">
                {{val.name}}
                <b-badge variant="info" pill class="float-right">{{val.value+(val.unit||'')}}</b-badge>
              </h5>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <separated title="状态量"></separated>
      <b-col></b-col>
    </b-row>
    <dev-table :query="query" :tableData="EmData"></dev-table>
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
} from "../../server/bin/interface";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    const { mountDev, pid, protocol, DevMac } = this.$route.query;
    return {
      query: {
        mountDev,
        pid,
        protocol,
        DevMac
      },
      EmData: {} as queryResultSave,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "Constant"
      >
    };
  },
  computed: {
    // ups工作模式
    betty_model() {
      const map = {
        在线模式: require("../../assets/image/ups3.gif"),
        旁路模式: require("../../assets/image/ups2.gif"),
        通电模式: require("../../assets/image/ups.gif"),
        待机模式: require("../../assets/image/ups.gif"),
        电池模式: require("../../assets/image/ups1.gif"),
        电池测试模式: require("../../assets/image/ups.gif"),
        故障模式: require("../../assets/image/ups.gif"),
        ECO节能模式: require("../../assets/image/ups.gif"),
        恒频模式: require("../../assets/image/ups.gif"),
        关机模式: require("../../assets/image/ups.gif")
      };
      const stat = {
        name: "待机模式",
        src: map["待机模式"]
      };
      const EmData = this.EmData;
      if (EmData?.parse && EmData.parse["工作模式"]) {
        const result = EmData.result.find(
          el => el.name === "工作模式"
        ) as queryResultArgument;
        const pas = this.$store.getters.getUnit(result) as queryResultArgument;
        stat.name = pas.value;
        stat.src = (map as any)[pas.value];
        // console.log({stat,pas});
      }
      return stat;
    },
    // 侧边栏UPS状态
    betty_stat() {
      let result = [] as queryResultArgument[];
      const DevConstant = this.DevConstant;
      const EmData = this.EmData;
      if (DevConstant && DevConstant.Constant && EmData && EmData.result) {
        const keys = Object.values(DevConstant.Constant);
        result = EmData.result.filter(el => keys.includes(el.name));
      }
      return result;
    }
  },
  apollo: {
    EmData: {
      query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          EmData: UartTerminalData(DevMac: $DevMac, pid: $pid) {
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
        const { pid, DevMac } = this.$data.query;
        return {
          pid: parseInt(pid),
          DevMac
        };
      },
      pollInterval: 2000
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
          Protocol: this.$data.query.protocol
        };
      }
    }
  }
});
</script>