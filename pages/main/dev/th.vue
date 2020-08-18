<template>
  <my-page-user-dev2 title="TH" :query="query" v-on:data="onData" v-on:constant="onConstant">
    <template>
      <b-col cols="6">
        <div class="ths">
          <i class="iconfont text-success">&#xe604;</i>
          <b>{{ TH.data.temperature }}&#8451;</b>
        </div>
      </b-col>
      <b-col cols="6">
        <div class="ths">
          <i class="iconfont text-primary">&#xe601;</i>
          <b>{{ TH.data.humidity }}%</b>
        </div>
      </b-col>
    </template>
  </my-page-user-dev2>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResult,
  queryResultSave,
  ProtocolConstantThreshold,
  queryResultArgument
} from "uart";
import gql from "graphql-tag";
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
      if (data?.parse) {
        const th = data.parse;
        this.TH.DateTime = new Date(data.timeStamp).toTimeString();
        this.TH.data.temperature = th["温度"]?.value || 0;
        this.TH.data.humidity = th["湿度"]?.value || 0;
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
