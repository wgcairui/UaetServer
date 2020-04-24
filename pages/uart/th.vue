<template>
  <my-page title="温湿度">
    <b-row>
      <separated title="th">{{ data.DateTime }}</separated>
      <b-col cols="6">
        <div class="ths">
          <i class="iconfont text-success">&#xe604;</i>
          <b>{{ data.data.temperature }}&#8451;</b>
        </div>
      </b-col>
      <b-col cols="6">
        <div class="ths">
          <i class="iconfont text-primary">&#xe604;</i>
          <b>{{ data.data.humidity }}%</b>
        </div>
      </b-col>
      <b-col cols="12"></b-col>
    </b-row>
    <b-row class="mt-5">
      <separated title="table"></separated>
      <b-col cols="12">
        <b-table-lite responsive :items="data.result" :fields="field">
          <template v-slot:cell(value)="row">
            <span>{{ row.value }}{{ row.item.unit }}</span>
          </template>
          <template v-slot:cell(oprate)="row">
            <b-button-group size="sm">
              <b-button
                variant="info"
                class="block px-1 py-0 pt-1"
                :to="{
                        name: 'uart-line',
                        query: { ...$route.query, name: row.item.name }
                      }"
              >趋势</b-button>
              <b-button @click="AlarmArgument(row.item)" variant="info">Alarm</b-button>
            </b-button-group>
          </template>
        </b-table-lite>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import { queryResult, queryResultSave } from "../../server/bin/interface";
import gql from "graphql-tag";
import { TerminalResultArrayToJson } from "../../plugins/tools";
export default Vue.extend({
  data() {
    return {
      UartTerminalData: null,
      field: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ]
    };
  },
  computed: {
    data() {
      let TH = {
        DateTime: new Date().toTimeString(),
        name: "温湿度",
        data: {
          temperature: 0,
          humidity: 0
        },
        result: [] as any[]
      };
      if (this.$data.UartTerminalData) {
        let thData = this.$data.UartTerminalData as queryResult
        let th = TerminalResultArrayToJson(thData.result as any[]);
        TH.DateTime = new Date(thData.time as string).toTimeString(),
        TH.data.temperature = th.get("温度");
        TH.data.humidity = th.get("湿度");
        TH.result = thData.result as any[];
      }
      return TH;
    }
  },
  apollo: {
    UartTerminalData: {
      query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          UartTerminalData(DevMac: $DevMac, pid: $pid) {
            result {
              name
              value
              unit
            }
            pid
            time
            mac
          }
        }
      `,
      variables() {
        return {
          pid: Number.parseInt(this.$route.query.pid as string),
          DevMac: this.$route.query.DevMac
        };
      },
      pollInterval: 10000,
      fetchPolicy: "no-cache"
    }
  },
  head() {
    return {
      title: "温湿度"
    };
  }
});
</script>

<style scoped>
i,
b {
  font-size: 2rem;
}
</style>
