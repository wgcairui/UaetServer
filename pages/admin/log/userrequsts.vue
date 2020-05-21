<template>
  <my-page-manage title="用户请求日志">
    <b-row>
      <b-col>
        <separated title="用户请求日志">
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
          <template v-slot:cell(argument)="row">
            <b-button
              size="sm"
              @click="row.toggleDetails"
              v-if="row.value"
            >{{row.detailsShowing ? '收起':'展开'}}</b-button>
          </template>
          <template v-slot:row-details="row">
            <b-card>
              <p>请求参数:{{row.item.argument}}</p>
            </b-card>
          </template>
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
        { key: "user", label: "用户" },
        { key: "userGroup", label: "用户组" },
        { key: "type", label: "操作类型" },
        { key: "argument", label: "参数" },
      ] as BvTableFieldArray
    };
  },

  apollo: {
    data: {
      query: gql`
        query loguserrequsts($start: Date, $end: Date) {
          data: loguserrequsts(start: $start, end: $end)
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