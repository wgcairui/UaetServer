<template>
  <my-page-user-dev2 title="ups" :query="query" v-on:data="onData" v-on:constant="onConstant">
    <template>
      <b-col cols="12" md="8" class="m-0 p-0 my-2">
        <b-card :sub-title="betty_model.name">
          <b-card-body>
            <b-img :src="betty_model.src" class="mw-100"></b-img>
          </b-card-body>
        </b-card>
      </b-col>
      <b-col cols="12" md="4" class="m-0 p-0 my-2">
        <b-card class="h-100">
          <b-card-title>
            电池状态
          </b-card-title>
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
    </template>
  </my-page-user-dev2>
</template>
<script lang="ts">
import Vue from "vue";
import {
  queryResultSave,
  ProtocolConstantThreshold,
  queryResultArgument,
  instructQueryArg
} from "uart";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    const map = {
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
      };
    // const { mountDev, pid, protocol, DevMac } = this.$route.query;
    return {
      map,
      // query: this.$route.query,
      EmData: {} as queryResultSave,
      DevConstant: {} as Pick<
        ProtocolConstantThreshold,
        "ProtocolType" | "Constant"
      >,
      // 电池工作模式
      betty_model:{
        name: "待机模式",
        src: map['待机模式']
      },
      // 电池状态
      betty_stat:[] as queryResultArgument[]
    };
  },
  computed:{
    query(){
      return this.$route.query
    }
  },
  methods: {
    onData(data: queryResultSave) {
      this.EmData = data;
      // 检查电池工作模式
      if (data?.parse["工作模式"]) {
        // console.log({data});
        /* const result = data.result.find(
          el => el.name === "工作模式"
        ) as queryResultArgument; */
        const pas = this.$store.getters.getUnit(data.parse["工作模式"]) as queryResultArgument;
        this.betty_model.name = pas.value;
        this.betty_model.src = (this.map as any)[pas.value];
        // console.log({pas,b:this.betty_model});
        
      }
    },
    onConstant(data:ProtocolConstantThreshold){
      // console.log(data);      
      this.DevConstant = data
      // 设置电池工作状态
      if (data.Constant && this.EmData && this.EmData.parse) {
        const keys = Object.values(data.Constant);
        this.betty_stat = Object.values(this.EmData.parse).filter(el => keys.includes(el.name));
      }
    }
  },
  
});
</script>