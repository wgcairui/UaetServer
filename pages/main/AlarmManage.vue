<template>
  <b-col xl="9" cols="12">
    <b-row>
      <b-col>
        <separated title="设备告警日志" back>
          <div class="d-flex">
            <b-button
              size="sm"
              variant="success"
              class="text-nowrap mr-1"
              @click="confrimAlarm('')"
            >全部确认</b-button>
            <b-input v-model="filter" placeholder="搜索数据" size="sm"></b-input>
          </div>
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
        <b-table
          id="my-table"
          :items="items"
          :per-page="perPage"
          :current-page="currentPage"
          :fields="fields"
          :filter="filter"
          hover
          :busy="$apollo.loading"
          responsive
        >
          <template v-slot:table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </template>
          <template v-slot:cell(isOk)="data">
            <b-button v-if="!data.value" size="sm" @click="confrimAlarm(data.item._id)">确认</b-button>
            <b-badge v-else>已确认</b-badge>
          </template>
          <slot></slot>
        </b-table>
        <b-pagination
          v-if="items.length>10"
          pills
          align="center"
          v-model="currentPage"
          :total-rows="items.length"
          :per-page="perPage"
          aria-controls="my-table"
        ></b-pagination>
      </b-col>
    </b-row>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
import { uartAlarmObject } from "uart";
export default Vue.extend({
  data() {
    return {
      perPage: 10,
      currentPage: 1,

      start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00",
      end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59",

      filter: this.$route.params.msg || "",
      items: [],
      fields: [
        { key: "mac", label: "终端" },
        { key: "pid", label: "地址码" },
        { key: "devName", label: "设备" },
        { key: "tag", label: "标签" },
        { key: "msg", label: "消息" },
        {
          key: "timeStamp", label: "时间", formatter: data => new Date(data).toLocaleString(), sortable: true
        },
        { key: 'isOk', label: '状态' }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    items: {
      query: gql`
        query loguartterminaldatatransfinites($start: Date, $end: Date) {
          items: loguartterminaldatatransfinites(start: $start, end: $end)
        }
      `,
      variables() {
        return { start: this.start, end: this.end };
      },
      update: ({ items }: { items: uartAlarmObject[] }) => items.map(el => {
        if (!el.isOk) {
          return Object.assign({ _rowVariant: 'danger' }, el)
        } else {
          return el
        }
      })
    }
  },
  methods: {
    async confrimAlarm(_id?: string) {
      const result = await this.$apollo.mutate({
        mutation: gql`
        mutation confrimAlarm($id:String){
          confrimAlarm(id:$id){
            ok
          }
        }
        `,
        variables: { id: _id }
      })
      console.log(result);
      this.$apollo.queries.items.refetch()

    }
  }
});
</script>