<template>
  <my-page-manage title="后台监控查询" :back="false" class="h-100">
    <b-row class="h-100">
      <b-col md="2" class="bg-dark d-flex flex-column p-4 text-light">
        <h6>
          <b-link to="/admin" class="text-decoration-none text-light">Home</b-link>
        </h6>
        <div v-for="(val,name,key) in nav" :key="key" class="pt-3">
          <h6>
            <i>{{name}}</i>
          </h6>
          <ul class="p-0">
            <li v-for="(link,key2) in val" :key="link.text+key2" class="my-1">
              <b-link :to="link.to" class="text-decoration-none">
                <span class="text-light">
                  <i class="iconfont ico">{{ link.ico }}</i>
                  {{ link.text }}
                </span>
              </b-link>
            </li>
          </ul>
        </div>
      </b-col>
      <b-col md="10" class="overflow-auto h-100">
        <b-card>
          <nuxt-child></nuxt-child>
        </b-card>
      </b-col>
    </b-row>
  </my-page-manage>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { VeLine, VePie, VeHistogram, VeGauge } from "v-charts";
interface navi {
  to: { name: string };
  text: string;
  ico: string;
}
interface runstate {
  online: number;
  all: number;
}
export default Vue.extend({
  components: { VeLine, VePie, VeHistogram, VeGauge },

  data() {
    return {
      nav: {
        基础数据: [
          {
            to: { name: "admin-node-Terminal" },
            text: "终端状态",
            ico: "\uEB63"
          },
          { to: { name: "admin-node-user" }, text: "用户", ico: "\uEB6f" },
          {
            to: { name: "admin-node-userSetup" },
            text: "用户设置",
            ico: "\uEB66"
          }
        ] as navi[],
        Socket: [
          { to: { name: "admin-socket-node" }, text: "节点", ico: "\uEB64" },
          { to: { name: "admin-socket-user" }, text: "用户", ico: "\uEB6f" }
        ] as navi[],
        log: [
          { to: { name: "admin-log-node" }, text: "节点", ico: "\uEB64" },
          { to: { name: "admin-log-terminal" }, text: "终端", ico: "\uEB23" },
          { to: { name: "admin-log-sms" }, text: "短信", ico: "\uEB8b" },
          { to: { name: "admin-log-mail" }, text: "邮件", ico: "\uEB8b" },
          {
            to: { name: "admin-log-uartterminaldatatransfinites" },
            text: "告警",
            ico: "\uEB68"
          },
          {
            to: { name: "admin-log-userlogins" },
            text: "用户登陆",
            ico: "\uEB6b"
          },
          {
            to: { name: "admin-log-userrequsts" },
            text: "用户请求",
            ico: "\uEB8c"
          }
        ] as navi[]
      }
    };
  }
});
</script>
<style scope>
.ico {
  font-size: 1rem;
}
li {
  list-style: none;
}
</style>
