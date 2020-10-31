<template>
  <my-page-user-dev2 title="Em电量仪" :query="query" v-on:data="onData" v-on:constant="onConstant">
    <template>
      <b-row class="w-100 my-2 px-2">
        <b-col cols="12">
          <span class="power-text d-block d-flex flex-column">
            <div class="d-flex flex-row justify-content-end power-body">
              <p class="text-danger">xxx</p>
              <i class="text-success">KW.h</i>
            </div>
            <b class="text-dark mt-auto power-title">电表电量</b>
          </span>
        </b-col>
      </b-row>
    </template>
  </my-page-user-dev2>
</template>
<script lang="ts">
import Vue, { PropType } from "vue";
import { BvTableFieldArray } from "bootstrap-vue";
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
});
</script>
<style lang="scss" scoped>
@media screen and (max-width: 375px) {
  .power-text {
    height: 72px;
    .power-title {
      margin-bottom: 2px;
      margin-left: 8px;
      font-size: 18px;
    }
    .power-body {
      margin-right: 15px;
      margin-top: 5px;
      i {
        margin-top: 12px;
        margin-left: 6px;
        font-size: 18px;
      }
      p {
        font-size: 28px;
        margin: 0;
      }
    }
  }
}
@media screen and (min-width: 375px) {
  .power-text {
    height: 88px;
    .power-title {
      margin-bottom: 2px;
      margin-left: 8px;
      font-size: 18px;
    }
    .power-body {
      margin-right: 15px;
      margin-top: 12px;
      i {
        margin-top: 12px;
        margin-left: 6px;
        font-size: 20px;
      }
      p {
        font-size: 32px;
        margin: 0;
      }
    }
  }
}
@media screen and (min-width: 675px) {
  .power-text {
    height: 140px;
    width: 80%;
    .power-title {
      margin-bottom: 2px;
      margin-left: 14px;
      font-size: 26px;
    }
    .power-body {
      margin-right: 20px;
      margin-top: 16px;
      i {
        margin-top: 28px;
        margin-left: 12px;
        font-size: 32px;
      }
      p {
        font-size: 60px;
        margin: 0;
      }
    }
  }
}
@media screen and (min-width: 975px) {
  .power-text {
    height: 190px;
    width: 60%;
    .power-title {
      margin-bottom: 12px;
      margin-left: 14px;
      font-size: 32px;
    }
    .power-body {
      margin-right: 32px;
      margin-top: 20px;
      i {
        margin-top: 36px;
        margin-left: 20px;
        font-size: 38px;
      }
      p {
        font-size: 72px;
        margin: 0;
      }
    }
  }
}
.row {
  margin-left: 0px;
}
.power-text {
  background-image: url("../assets/image/power.png");
  background-size: cover;
}
</style>