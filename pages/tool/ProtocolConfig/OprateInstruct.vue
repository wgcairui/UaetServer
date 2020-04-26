<template>
  <my-page title="操作指令">
    <b-row>
      <b-col>
        <separated title="添加状态量参数"></separated>
        <b-from>
          <b-form-group v-bind="forGroup" label="Name:">
            <b-form-select :options="list.Stats" v-model="StatName"></b-form-select>
          </b-form-group>
          
        </b-from>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { protocol } from "../../../server/bin/interface";
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      //
      StatName: ""
    };
  },
  computed: {
    list() {
      const protocolList = {
        Ints: [] as string[],
        Stats: [] as string[]
      };
      const ProtocolSingle = this.$data.ProtocolSingle as protocol;
      if (ProtocolSingle) {
        ProtocolSingle.instruct.forEach(el => {
          el.formResize.forEach(els => {
            if (els.isState) protocolList.Stats.push(els.name);
            else protocolList.Ints.push(els.name);
          });
        });
      }
      return protocolList;
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
        return { Protocol: this.$data.Protocol };
      }
    }
    /* ShowTag: {
      query: gql`
        query getDevConstant($Protocol: String) {
          ShowTag: getDevConstant(Protocol: $Protocol) {
            ShowTag
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.ShowTag.ShowTag
    } */
  }
});
</script>