<template>
  <b-row>
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
  </b-row>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  props: {
    dev: {
      type: Object as PropType<Uart.queryResultSave>,
      default: {}
    },
    Constant: {
      type: Object as PropType<Uart.ProtocolConstantThreshold>
    }
  },
  computed: {
    TH() {
      const data = this.dev as Uart.queryResultSave
      if (data?.parse) {
        const th = data.parse;
        return {
          DateTime: new Date(data.timeStamp).toTimeString(), name: "温湿度", data: { temperature: th["温度"]?.value || 0, humidity: th["湿度"]?.value || 0 }
        }
      } else {
        return { DateTime: new Date().toTimeString(), data: { temperature: 0, humidity: 0 } }
      }
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
