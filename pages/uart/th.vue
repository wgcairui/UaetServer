<template>
  <my-page-user-dev title="TH" :query="query" v-on:data="onData" v-on:constant="onConstant">
    <template>
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
    </template>
  </my-page-user-dev>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResult,
  queryResultSave,
  ProtocolConstantThreshold,
  queryResultArgument
} from "../../server/bin/interface";
import gql from "graphql-tag";
import { TerminalResultArrayToJson } from "../../plugins/tools";
export default Vue.extend({
  data() {
    return {
      query: this.$route.query,
      EmData: {} as queryResultSave,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "Constant"
      >,
      //
      TH: {
        DateTime: new Date().toTimeString(),
        name: "温湿度",
        data: {
          temperature: 0,
          humidity: 0
        },
        result: [] as queryResultArgument[]
      }
    };
  },
  methods: {
    onData(data: queryResultSave) {
      this.EmData = data;
      if (data.result) {
        let th = TerminalResultArrayToJson(data.result as any[]);
        (this.TH.DateTime = new Date(data.timeStamp).toTimeString()),
          (this.TH.data.temperature = th.get("温度"));
        this.TH.data.humidity = th.get("湿度");
        this.TH.result = data.result;
      }
    },
    onConstant(data: ProtocolConstantThreshold) {
      // console.log(data);
      this.DevConstant = data;
    }
  }
});
</script>
<style scoped>
i,
b {
  font-size: 2rem;
}
</style>
