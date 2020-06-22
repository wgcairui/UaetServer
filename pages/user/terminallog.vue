<template>
  <my-page-user title="设备在线日志">
    <b-row>
      <b-col>
        <separated title="终端日志" />
        <b-form>
          <my-form label="开始时间:">
            <b-form-datepicker v-model="start" locale="zh" size="sm" :max="end"></b-form-datepicker>
          </my-form>
          <my-form label="结束时间:">
            <b-form-datepicker v-model="end" locale="zh" size="sm" :max="new Date()"></b-form-datepicker>
          </my-form>
        </b-form>
        <ve-line :data="lines" :settings="chartSettings"></ve-line>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { VeLine } from "v-charts";
import { logTerminals } from "../../server/bin/interface";
export default Vue.extend({
  components: { VeLine },
  data() {
    return {
      mac: this.$route.query.DevMac,
      start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00",
      end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59",
      data: [],
      chartSettings: {
        area: true
      }
    };
  },
  computed: {
    lines() {
      const data = this.$data.data as logTerminals[];
      const item = {
        columns: ["time", "type"],
        rows: [] as any[]
      };
      if (data?.length > 0) {
        let temp = 1;
        item.rows = data
          .map(el => ({
            time: new Date(el.createdAt as Date).toLocaleString(),
            type: el.type === "连接" ? 1 : 0
          }))
          .filter(el => {
            if (el.type === temp) return false;
            else {
              temp = el.type;
              return true;
            }
          });
      }
      return item;
    }
  },
  apollo: {
    data: {
      query: gql`
        query userlogterminals($start: Date, $end: Date, $mac: String) {
          data: userlogterminals(start: $start, end: $end, mac: $mac) {
            createdAt
            type
          }
        }
      `,
      variables() {
        return {
          start: this.$data.start,
          end: this.$data.end,
          mac: this.$data.mac
        };
      }
    }
  }
});
</script>