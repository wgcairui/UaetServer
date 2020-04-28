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
        <b-card class="m-2">
          <b-card-title>
            电池状态
            <b-button class="float-right" size="sm" variant="info">操作</b-button>
          </b-card-title>
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
    betty_model() {
      const map = {
        L: {
          name: "在线模式",
          src: require("../../assets/image/ups3.gif")
        },
        B: {
          name: "电池模式",
          src: require("../../assets/image/ups1.gif")
        },
        Y: {
          name: "旁路模式",
          src: require("../../assets/image/ups2.gif")
        },
        P: {
          name: "通电模式",
          src: require("../../assets/image/ups.gif")
        },
        S: {
          name: "待机模式",
          src: require("../../assets/image/ups.gif")
        }
      };
      let stat = map.P
      const EmData = this.EmData
      if(EmData?.parse && EmData.parse["工作模式"]){
          stat = (map as any)[EmData.parse["工作模式"]]
      }    
      return stat
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
      pollInterval: 5000
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
  }
});
</script>