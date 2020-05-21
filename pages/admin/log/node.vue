<template>
  <my-page-manage title="节点日志">
    <b-row>
      <b-col>
        <separated title="节点日志">
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
        
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <my-table-log :items="data" :fields="fields" :filter="filter" :busy="$apollo.loading">
        </my-table-log>
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
      start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00",
      end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59",
      filter: "" as string,
      data: [],
      fields: [
        { key: "IP", label: "节点" },
        { key: "Name", label: "节点名称" },
        { key: "type", label: "类型" },
        { key: "ID", label: "socketID" }        
      ] as BvTableFieldArray
    };
  },
  apollo: {
    data: {
      query: gql`
        query lognodes($start: Date, $end: Date) {
          data: lognodes(start: $start, end: $end)
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