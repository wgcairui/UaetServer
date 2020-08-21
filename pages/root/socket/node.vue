<template>
  <b-col>
    <separated title="终端">
      <b-input v-model="filter" placeholder="输入设备ID搜索数据" size="sm"></b-input>
    </separated>
    <b-table :items="node" :fields="fields">
      <template v-slot:cell(terminal)="row">
        <b-link :to="{name:'root-node-Terminal',query:{DevMac:row.value}}">{{row.value}}</b-link>
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
      filter: this.$route.query.DevMac || "",
      node: [],
      fields: [
        { key: "terminal", label: "在线终端" },
        {
          key: "TimeOutMonutDev",
          label: "超时设备",
          formatter: (value: string[], key, item) =>
            value.map(el => el.replace(item.terminal, ""))
        }
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