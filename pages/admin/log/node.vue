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
        <b-table
          id="my-table"
          :items="data"
          :per-page="perPage"
          :current-page="currentPage"
          :fields="fields"
          :filter="new RegExp(filter)"
        >
          <template v-slot:cell(ids)="row">{{(currentPage*10-10)+(row.index+1)}}</template>
        </b-table>
        <b-pagination
          v-if="rows>10"
          pills
          align="center"
          v-model="currentPage"
          :total-rows="rows"
          :per-page="perPage"
          aria-controls="my-table"
        ></b-pagination>
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
      perPage: 10,
      currentPage: 1,
      filter: "" as string,
      data: [],
      fields: [
        { key: "ids", label: "id" },
        { key: "IP", label: "节点" },
        { key: "Name", label: "节点名称" },
        { key: "type", label: "类型" },
        { key: "ID", label: "socketID" },
        {
          key: "createdAt",
          label: "时间",
          formatter: data => new Date(data).toLocaleString()
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