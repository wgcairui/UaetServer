<template>
  <my-page-manage title="节点Tcp">
    <b-row>
      <b-col>
        <b-table :items="node" :fields="fields">
          <template v-slot:cell(set)="row">
            <b-link
              v-for="i in row.value"
              :key="i"
              :to="{name:'admin-node-Terminal',query:{DevMac:i}}"
            >{{i}}</b-link>
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
      node: [],
      fields: [
        { key: "node", label: "挂载节点" },
        { key: "set", label: "在线终端" },
        { key: "timeOutOprate", label: "超时" }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    node: {
      query: gql`
        {
          node: getSocketNode
        }
      `,
      pollInterval: 1000
    }
  }
});
</script>