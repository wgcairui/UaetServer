<template>
  <my-page-manage title="用户状态" :isUser="false">
    <b-row class="my-5">
      <b-col>
        <b-table :items="Users" :fields="NodeInfoFields" responsive striped>
          <template v-slot:cell(ProtocolSetup)="row">
            <b-button
              size="sm"
              @click="row.toggleDetails"
              v-if="row.value"
            >{{row.detailsShowing ? '收起':'展开'}}</b-button>
          </template>
          <template v-slot:row-details="row">
            <b-table :items="row.item.ProtocolSetup" :fields="childFields"></b-table>
          </template>
        </b-table>
      </b-col>
    </b-row>
  </my-page-manage>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      Users: [],
      NodeInfoFields: [
        { key: "user", label: "账号" },
        { key: "tels", label: "告警号码" },
        { key: "mails", label: "告警邮箱" },
        { key: "ProtocolSetup", label: "协议配置" }
      ] as BvTableFieldArray,
      childFields: [
        { key: "Protocol", label: "协议" },
        { key: "ProtocolType", label: "类型" },
        { key: "Threshold", label: "阀值" },
        { key: "ShowTag", label: "显示标签" }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    Users: gql`
      {
        Users: getUserSetups {
          user
          tels
          mails
          ProtocolSetup {
            Protocol
            ProtocolType
            Constant {
              #air
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
              # th and air
              Temperature
              Humidity
              # ups
              UPSModels
              BatteryTemperature
              ResidualCapacity
              BatteryVoltage
              OutputFrequency
              OutputLoad
            }
            Threshold
            ShowTag
            OprateInstruct {
              name
              value
              bl
              readme
            }
          }
        }
      }
    `
  }
});
</script>
