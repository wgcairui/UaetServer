<template>
  <b-col>
    <separated title="邮件日志">
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
    <my-table-log :items="data" :fields="fields" :filter="filter" :busy="$apollo.loading"></my-table-log>
  </b-col>
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
        { key: "mails", label: "邮箱地址", formatter: data => data.join(",") },
        { key: "sendParams", label: "事件", formatter: data => data.html },
        {
          key: "Success",
          label: "messageId",
          formatter: data => data.messageId
        }
      ] as BvTableFieldArray
    };
  },
  computed: {
    rows() {
      return this.$data.data.length;
    }
  },
  apollo: {
    data: {
      query: gql`
        query logsmssends($start: Date, $end: Date) {
          data: logmailsends(start: $start, end: $end)
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