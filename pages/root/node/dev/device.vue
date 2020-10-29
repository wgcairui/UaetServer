<template>
  <b-col>
    <b-row class="m-0 mb-5">
      <separated :title="query.mountDev">
        <b
          v-b-tooltip.hover
          :title="Queryarg.useTime + '/' + Queryarg.Interval"
        >{{ Queryarg.queryTime }}</b>
      </separated>
    </b-row>

    <b-row>
      <b-overlay :show="$apollo.loading" class="w-100 px-2">
        <b-table :items="line" :fields="fields">
          <template v-slot:cell(value)="row">
            <span class="mr-">{{ row.value }}</span>
            <span>{{ row.item.unit }}</span>
          </template>
          <template v-slot:cell(oprate)="row">
            <b-button-group size="sm" v-if="row.item.issimulate">
              <b-button
                variant="info"
                class="block px-1 py-0 pt-1"
                :to="{ name: 'root-node-dev-line', query: { ...$route.query, name: row.item.name }}"
              >趋势</b-button>
            </b-button-group>
          </template>
        </b-table>
      </b-overlay>
    </b-row>
  </b-col>
</template>
<script lang="ts">
  import Vue from "vue";
  import { queryResultSave, ProtocolConstantThreshold, queryResultArgument, PageQuery } from "uart";
  import { BvTableFieldArray } from "bootstrap-vue";
  import gql from "graphql-tag";
  export default Vue.extend({
    data() {
      return {
        query: this.$route.query,
        Data: {} as queryResultSave,
        fields: [
          { key: "name", label: "变量" },
          { key: "value", label: "值" },
          { key: "oprate", label: "操作" }
        ] as BvTableFieldArray,
      };
    },
    watchQuery: true,

    //
    computed: {
      // 从设备数据中刷选出用户指定的参数值
      line() {
        // 状态量
        let quantity: queryResultArgument[] = [];
        const Data = this.Data as queryResultSave;
        if (Data?.parse) {
          quantity = Object.values(Data.parse).map(el => this.$store.getters.getUnit(el));
        }
        return quantity
      },
      // 查询耗时和查询间隔
      Queryarg() {
        const Data = this.$data.Data as queryResultSave;
        const time = { queryTime: "", useTime: 0, Interval: 0 };
        if (Data?.parse) {
          time.useTime = Data.useTime;
          time.Interval = Data.Interval;
          time.queryTime = Data.time
        }
        return time;
      }
    },
    apollo: {
      // 设备数据
      Data: {
        query: gql`
        query getUartTerminalData($DevMac: String, $pid: Int) {
          Data: UartTerminalData(DevMac: $DevMac, pid: $pid) {
            parse
            pid
            time
            mac
            Interval
            useTime
          }
        }
      `,
        variables() {
          const { pid, DevMac } = this.$route.query;
          return { pid: parseInt(pid as string), DevMac };
        },
        pollInterval: 5000
      }
    }
  });
</script>
<style lang="scss" scoped>
  .value {
    font-size: 1.3rem;
  }
</style>