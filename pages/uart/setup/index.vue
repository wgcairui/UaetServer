<template>
  <my-page :title="'设备常量配置-'+DevMac">
    <b-row>
      <b-col>
        <separated title="add Sim"></separated>
        <b-table :items="items">
          <template v-slot:cell(show)="row">
            <b-form-checkbox v-model="row.value" @change="selects(row.item)"></b-form-checkbox>
          </template>
        </b-table>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  protocol,
  queryResult,
  ProtocolConstantThreshold
} from "../../../server/bin/interface";
interface tags {
  name: string;
  show: boolean;
}
export default Vue.extend({
  data() {
    const { mountDev, pid, protocol, DevMac } = this.$route.query;
    return {
      mountDev,
      pid,
      protocol,
      DevMac,
      //
      ProtocolSingle: {} as queryResult,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "ShowTag" | "Threshold"|"Constant"
      >
    };
  },
  computed: {
    items() {
      const ProtocolSingle: protocol = this.$data.ProtocolSingle;
      const DevConstant = this.DevConstant;
      const result: tags[] = [];
      if (ProtocolSingle?.instruct && DevConstant?.ShowTag) {
        ProtocolSingle.instruct.forEach(el => {
          el.formResize.forEach(ep => {
            result.push({ name: ep.name, show: DevConstant.ShowTag.includes(ep.name) });
          });
        });
      }
      return result;
    }
  },
  apollo: {
    ProtocolSingle: {
      query: gql`
        query getProtocol($Protocol: String) {
          ProtocolSingle: Protocol(Protocol: $Protocol) {
            instruct {
              formResize
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.protocol };
      }
    },
    DevConstant: {
      query: gql`
        query getDevConstant($Protocol: String) {
          DevConstant: getDevConstant(Protocol: $Protocol) {
            ShowTag
            Threshold
            Constant {
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
        return { Protocol: this.$data.protocol };
      }
    }
  },
  methods: {
    selects(item: any) {}
  }
});
</script>