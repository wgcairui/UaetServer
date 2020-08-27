<template>
  <b-col>
    <separated title="用户状态">
      <b-input v-model="filter" placeholder="输入账号搜索数据" size="sm"></b-input>
    </separated>
    <b-table :items="Users" :fields="NodeInfoFields" responsive striped>
      <template v-slot:cell(ProtocolSetup)="row">
        <b-button
          size="sm"
          @click="row.toggleDetails"
          v-if="row.value && row.value.length > 0"
        >{{row.detailsShowing ? '收起':'展开'}}</b-button>
      </template>
      <template v-slot:row-details="row">
        <b-table :items="row.item.ProtocolSetup" :fields="childFields" stacked></b-table>
      </template>
    </b-table>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      filter: this.$route.query.user || "",
      Users: [],
      NodeInfoFields: [
        { key: "user", label: "账号" },
        { key: "tels", label: "告警号码", formatter: tels => tels.join(",") },
        { key: "mails", label: "告警邮箱", formatter: tels => tels.join(",") },
        { key: "ProtocolSetup", label: "协议配置" }
      ] as BvTableFieldArray,
      childFields: [
        { key: "Protocol", label: "协议" },
        {
          key: "Threshold", label: "阀值", formatter: data => data.map(el => `${el.name}:${el.min}-${el.max}`).join(",")
        },
        { key: "ShowTag", label: "显示标签", formatter: data => data.join(",") }
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
