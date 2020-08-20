<template>
  <b-row>
    <b-col cols="12" md="8" class="m-0 p-0 my-2">
      <b-card :sub-title="betty_model.name">
        <b-card-body>
          <b-img :src="betty_model.src" class="mw-100"></b-img>
        </b-card-body>
      </b-card>
    </b-col>
    <b-col cols="12" md="4" class="m-0 p-0 my-2">
      <b-card class="h-100">
        <b-card-title>电池状态</b-card-title>
        <b-card-body class="p-0">
          <div
            class="border p-2 shadow-sm rounded-lg my-2"
            v-for="val in betty_stat"
            :key="val.name"
          >
            <h5 class="m-0">
              {{val.name}}
              <b-badge variant="info" pill class="float-right">{{val.value+(val.unit||'')}}</b-badge>
            </h5>
          </div>
        </b-card-body>
      </b-card>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { queryResultSave, ProtocolConstantThreshold, queryResultArgument, instructQueryArg } from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  props: {
    dev: {
      type: Object as PropType<queryResultSave>,
      default: {}
    },
    Constant: {
      type: Object as PropType<ProtocolConstantThreshold>
    }
  },
  data() {
    return {
      map: {
        在线模式: require("~/assets/image/ups3.gif"),
        旁路模式: require("~/assets/image/ups2.gif"),
        通电模式: require("~/assets/image/ups.gif"),
        待机模式: require("~/assets/image/ups.gif"),
        电池模式: require("~/assets/image/ups1.gif"),
        电池测试模式: require("~/assets/image/ups.gif"),
        故障模式: require("~/assets/image/ups.gif"),
        ECO节能模式: require("~/assets/image/ups.gif"),
        恒频模式: require("~/assets/image/ups.gif"),
        关机模式: require("~/assets/image/ups.gif")
      },
    };
  },
  computed: {
    // 电池工作模式
    betty_model() {
      const data = this.dev as queryResultSave
      //return { name: "待机模式", src: this.$data.map['待机模式'] }
      if (data?.parse && data?.parse["工作模式"]) {
        const pas = this.$store.getters.getUnit(data.parse["工作模式"]) as queryResultArgument;
        return { name: pas.value, src: this.$data.map[pas.value] }
      } else {
        return { name: "待机模式", src: this.$data.map['待机模式'] }
      }
    },
    // 电池状态
    betty_stat() {
      const Constant = this.Constant as ProtocolConstantThreshold
      const data = this.dev as queryResultSave
      // return []
      if (Constant.Constant && data.parse) {
        const keys = Object.values(Constant.Constant);
        return Object.values(data.parse).filter(el => keys.includes(el.name));
      } else {
        return []
      }
    }
  }
});
</script>