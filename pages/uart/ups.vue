<template>
  <my-page title="UPS">
    <b-row class="m-0">
      <b-col cols="12" md="8" class="m-0 p-0 my-2">
        <b-card>
          <b-card-body>
            <b-img :src="betty_model" class="mw-100"></b-img>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col cols="12" md="4" class="m-0 p-0 my-2">
        <b-button-group class="px-3 pb-1">
          <b-button @click="oprate('StartUps')">OPEN</b-button>
          <b-button @click="oprate('ShutdownUps')">CLOSE</b-button>
          <b-button>xx</b-button>
        </b-button-group>

        <b-card>
          <!-- <argumentBlocktwo
            v-for="([keys, val], key) in filter_core"
            :keys="keys"
            :val="val"
            :key="key"
          ></argumentBlocktwo>-->
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <separated title="状态量"></separated>
      <b-col></b-col>
    </b-row>
    <dev-table :query="query" :tableData="EmData"></dev-table>
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
    parseargument(): { [x: string]: any } {
      const EmData = this.EmData as queryResultSave;
      if (EmData.result) {
        return Object.assign({},...EmData.result.map(el => ({ [el.name]: el.value })))
      } else {
        return {};
      }
    },
    betty_model() {
      const map = {
        L: require("../../assets/image/ups3.gif"),
        B: require("../../assets/image/ups1.gif"),
        Y: require("../../assets/image/ups2.gif"),
        P: require("../../assets/image/ups.gif"),
        S: require("../../assets/image/ups.gif")
      };
      const stat = (this as any).parseargument['工作模式']
      return stat ? (map as any)[stat]:map.P
      //return map[this.device["Ups Mode"].trim()];
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
      pollInterval: 5000,
      fetchPolicy: "no-cache"
    },
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ProtocolType
            Constant {
              HeatChannelTemperature
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
  },
  methods: {
    oprate(oprate: string) {}
  }
});
</script>