<template>
  <b-col>
    <b-overlay :show="$apollo.loading">
      <b-tabs justified>
        <b-tab title="模拟量">
          <b-table :items="line.simulate" :fields="fields">
            <template v-slot:cell(value)="row">
              <b class="value">
                <b-badge>{{row.value}}</b-badge>
              </b>
              <span>{{row.item.unit}}</span>
            </template>
            <template v-slot:cell(oprate)="row">
              <b-button-group size="sm" v-if="row.item.unit">
                <b-button
                  variant="info"
                  class="block px-1 py-0 pt-1"
                  :to="{
                        name: 'uart-line',
                        query: { ...$route.query, name: row.item.name }
                      }"
                >趋势</b-button>
                <!-- <b-button @click="AlarmArgument(row.item)" variant="info">Alarm</b-button> -->
              </b-button-group>
            </template>
          </b-table>
        </b-tab>
        <b-tab title="状态量" lazy v-if="line.quantity.length>0">
          <b-table :items="line.quantity" :fields="fields"></b-table>
        </b-tab>
      </b-tabs>
    </b-overlay>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import { queryResultArgument, queryResultSave } from "../server/bin/interface";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  props: {
    tableData: {
      type: Object
    },
    query: {
      type: Object
    }
  },
  data() {
    return {
      fields: [
        { key: "name", label: "变量" },
        { key: "value", label: "值" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray,
      // modal
      oprate: false,
      oprateArg: null
    };
  },
  computed: {
    Query() {
      return this.query;
    },
    Data() {
      return this.tableData;
    },
    line() {
      // 状态量
      const quantity: queryResultArgument[] = [];
      // 模拟量
      const simulate: queryResultArgument[] = [];
      if (this.Data?.result) {
        const Data = this.Data as queryResultSave;
        // 空调设备数据
        const result: queryResultArgument[] = Data.result;
        result.forEach(el => {
          const valGetter: queryResultArgument = (this
            .$store as any).getters.getUnit(el);
          valGetter.issimulate
            ? simulate.push(valGetter)
            : quantity.push(valGetter);
        });
      }
      return { simulate, quantity };
    }
  },
  methods: {
    // 发送设备状态量指令
    DevBind(item: queryResultArgument) {
      const { mountDev, pid, protocol, DevMac } = this.query;
      this.oprate = !this.oprate;
      this.$data.oprateArg = { item, query: this.query };
    },
    // 隐藏设备显示参数
    DisabledArgument(item: queryResultArgument) {},
    // 查看设备参数报警
    AlarmArgument(item: queryResultArgument) {}
  }
});
</script>
<style lang="scss" scoped>
.value {
  font-size: 1.3rem;
}
</style>