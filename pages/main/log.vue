<template>
  <b-col xl="9" cols="12">
    <b-tabs pills class="my-3">
      <b-tab title="设备运行日志">
        <b-table :items="terminals" :fields="fieldsTerminal" responsive striped>
          <template v-slot:cell(query)="row">
            <b-button
              size="sm"
              @click="row.toggleDetails"
              v-if="row.value"
            >{{row.detailsShowing ? '收起':'展开'}}</b-button>
          </template>
          <template v-slot:row-details="row">
            <b-card>
              <p>请求参数:{{row.item.query}}</p>
              <p>请求结果:{{row.item.result}}</p>
            </b-card>
          </template>
        </b-table>
      </b-tab>
      <b-tab title="infos">
        <b-table :items="infos" :fields="fields"></b-table>
      </b-tab>
    </b-tabs>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import { getInstance, WebInfo } from "../../store/DB";
import { BvTableFieldArray } from "bootstrap-vue/src/components/table";
import { logTerminals } from "uart";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      infos: [] as WebInfo[],
      fields: [
        "id",
        { key: "time", label: "时间", sortable: true },
        { key: "type", label: "类型", sortable: true },
        { key: "msg", label: "消息" }
      ] as BvTableFieldArray,
      terminals: [] as logTerminals[],
      fieldsTerminal: [
        { key: "NodeName", label: "挂载节点" },
        { key: "TerminalMac", label: "设备ID" },
        { key: "type", label: "类型" },
        { key: "msg", label: "消息" },
        { key: "query", label: "请求" },
        { key: "createdAt", label: "时间", formatter: val => new Date(val).toLocaleString() }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    terminals: {
      query: gql`
        query getLogTerminal {
          terminals: getLogTerminal {
            NodeName
            TerminalMac
            type
            msg
            query
            result
            createdAt
          }
        }
      `,
      update: data => (data.terminals ? data.terminals.reverse() : [])
    }
  },
  methods: {
    async getInfos() {
      const result = await getInstance().queryAll<WebInfo>({ tableName: "Infos" });
      this.infos = result;
    }
  },
  mounted() {
    console.log(this.$route.params);
    this.getInfos();
  }
});
</script>
