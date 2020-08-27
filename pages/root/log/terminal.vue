<template>
  <b-col>
    <separated title="终端日志">
      <b-input v-model="filter" placeholder="搜索数据" size="sm"></b-input>
    </separated>
    <b-form>
      <my-form label="开始时间:">
        <b-form-datepicker v-model="start" locale="zh" size="sm" :max="end"></b-form-datepicker>
      </my-form>
      <my-form label="结束时间:">
        <b-form-datepicker v-model="end" locale="zh" size="sm" :max="new Date()"></b-form-datepicker>
      </my-form>
    </b-form>
    <my-table-log :items="data" :fields="fields" :filter="filter" :busy="$apollo.loading" />
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
import { queryResult } from "uart";
export default Vue.extend({
  data() {
    return {
      start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00",
      end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59",
      filter: this.$route.query.mac || "" as string,
      data: [],
      fields: [
        { key: "NodeIP", label: "节点" },
        { key: "NodeName", label: "节点名称" },
        { key: "type", label: "类型" },
        { key: "TerminalMac", label: "终端ID" },
        {
          key: "query", label: "请求",
          formatter: (data: queryResult) =>
            data ? `设备:${data.mountDev},协议:${data.protocol},类型:${data.type},Pid:${data.pid},查询耗时:${data.useTime}` : ''
        }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    data: {
      query: gql`
        query logterminals($start: Date, $end: Date) {
          data: logterminals(start: $start, end: $end)
        }
      `,
      variables() {
        return {
          start: this.$data.start,
          end: this.$data.end
        };
      }
    }
  }
});
</script>