<template>
  <my-page-user title="节点运行状态" :isUser="false">
    <b-row class="my-5">
      <b-col>
        <b-card>
          <b-table-lite :items="NodeInfo" :fields="NodeInfoFields" responsive>
            <template v-slot:cell(loadavg)="row">
              <i>{{ row.value.map(el => parseFloat(el.toFixed(2))).join("/ ") }}</i>
            </template>
            <template v-slot:cell(updateTime)="row">{{ new Date(row.value).toLocaleString()}}</template>
          </b-table-lite>
        </b-card>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      NodeInfo: [],
      NodeInfoFields: [
        { key: "NodeName", label: "节点名称" },
        { key: "totalmem", label: "节点内存" },
        { key: "freemem", label: "使用内存" },
        { key: "loadavg", label: "负载(1/5/15min)" },
        { key: "type", label: "类型" },
        { key: "uptime", label: "运行时间" },
        { key: "Connections", label: "终端数" },
        { key: "updateTime", label: "更新时间" }
      ]
    };
  },
  apollo: {
    NodeInfo: gql`
      {
        NodeInfo {
          updateTime
          hostname
          totalmem
          freemem
          loadavg
          type
          uptime
          NodeName
          Connections
          SocketMaps {
            mac
            port
            ip
            jw
          }
        }
      }
    `
  }
});
</script>
