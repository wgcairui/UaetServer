<template>
  <div>
    <my-head title="温湿度"></my-head>
    <b-container>
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
              <b-button
                :to="{
                  name: 'UT-line',
                  query: { ...$route.query, name: row.item.name }
                }"
              >趋势</b-button>
            </template>
          </b-table-lite>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import separated from "../../components/separated.vue";
import MyHead from "../../components/MyHead.vue";
import { queryResult } from "../../server/bin/interface";
import gql from "graphql-tag";
import { TerminalResultArrayToJson } from "../../plugins/tools";
export default Vue.extend({
  components: { MyHead, separated },
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
        DateTime: new Date(),
        name: "温湿度",
        data: {
          temperature: 0,
          humidity: 0
        },
        result: []
      };
      if (this.$data.UartTerminalData) {
        let { result, time } = this.$data.UartTerminalData;
        let th = TerminalResultArrayToJson(result);
        TH.DateTime = time;
        TH.data.temperature = th.get("温度");
        TH.data.humidity = th.get("湿度");
        TH.result = result;
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
      pollInterval: 5000,
      fetchPolicy: "network-only"
    }
    /* query() {
        switch (this.$data.dataType) {
          case "ut":
            return gql`
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
            `;
            break;
        }
      },
      variables() {
        switch (this.dataType) {
          case "ut":
            return {
              pid: Number.parseInt(this.$route.query.pid),
              DevMac: this.$route.query.DevMac
            };
            break;
        }
      },
      pollInterval: 5000,
      fetchPolicy: "cache-and-network"
    } */
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
