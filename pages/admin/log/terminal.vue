<template>
  <my-page-manage title="终端日志">
    <b-row>
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
        <b-table
          id="my-table"
          :items="data"
          :per-page="perPage"
          :current-page="currentPage"
          :fields="fields"
          :filter="new RegExp(filter)"
          hover
        >
          <template v-slot:cell(ids)="row">{{(currentPage*10-10)+(row.index+1)}}</template>
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
        { key: "NodeIP", label: "节点" },
        { key: "NodeName", label: "节点名称" },
        { key: "type", label: "类型" },
        { key: "TerminalMac", label: "终端ID" },
        { key: "msg", label: "消息" },
        { key: "query", label: "请求" },
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