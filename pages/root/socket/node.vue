<template>
  <b-col>
    <separated title="终端">
      <b-input v-model="filter" placeholder="输入设备ID搜索数据" size="sm"></b-input>
    </separated>
    <b-table :items="node" :fields="fields">
      <template v-slot:cell(terminal)="row">
        <b-link :to="{name:'root-node-Terminal',query:{DevMac:row.value}}">{{row.value}}</b-link>
      </template>
      <template v-slot:cell(TimeOutMonutDev)="row">
        {{row.value.map(el=>el.mountDev+el.pid).join(",")}}
        <b-button
          size="sm"
          @click="row.toggleDetails"
          v-if="row.value && row.value.length > 0"
        >{{row.detailsShowing ? '收起':'展开'}}</b-button>
      </template>
      <template v-slot:row-details="row">
        <b-table :items="row.item.TimeOutMonutDev" stacked></b-table>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button-group size="sm">
          <b-button :to="{name:'root-log-terminal',query:{mac:row.item.terminal}}">日志</b-button>
        </b-button-group>
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
        { key: 'name', label: '别名' },
        { key: "TimeOutMonutDev", label: "超时设备" },
        { key: 'oprate', label: '操作' }
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