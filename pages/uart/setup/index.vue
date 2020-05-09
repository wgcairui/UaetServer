<template>
  <my-page :title="`设备常量配置-${DevMac}-${pid}-${mountDev}`">
    <b-row>
      <b-col>
        <separated title="添加透传终端自定义配置"></separated>
        <b-tabs justified>
          <!-- ShowTag -->
          <b-tab title="显示参数">
            <b-table :items="items" :fields="fieldsSHowTag">
              <template v-slot:cell(show)="row">
                <b-form-checkbox v-model="row.value" @change="selects(row.item)"></b-form-checkbox>
              </template>
            </b-table>
          </b-tab>
          <!-- Threshold -->
          <b-tab title="参数限值"></b-tab>
          <!-- Constant 
          <b-tab title="Constant"></b-tab>-->
        </b-tabs>
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
import { BvTableFieldArray } from "bootstrap-vue";
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
      // fields
      fieldsSHowTag:[{key:'name',label:'名称'},{key:'show',label:'显示'}] as BvTableFieldArray,
      //
      //ProtocolSingle: {} as queryResult,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "ShowTag" | "Threshold" | "Constant"
      >
    };
  },
  computed: {
    items() {
      //const ProtocolSingle: protocol = this.$data.ProtocolSingle;
      const DevConstant = this.DevConstant;
      let result: tags[] = [];
      if ( DevConstant?.ShowTag) {
        result = DevConstant.ShowTag.map(el => ({name:el,show:true})
        );
      }
      return result;
    }
  },
  apollo: {
    
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
    selects(item: any) {
      console.log(item);
      
    }
  }
});
</script>
<style lang="scss" scoped>
.nav-link a{
  color: black;
}
</style>