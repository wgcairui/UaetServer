<template>
  <div class="h-100 w-100 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="dark" class="align-items-start">
      <b-navbar-brand>
        <span class="text-center text-light" style="font-size:1rem">LADS云平台后台监控查询</span>
      </b-navbar-brand>
      <div class="navber-m-2 ml-auto">
        <div class="navber-m-3 float-right d-inline-flex flex-column head-right">
          <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
          <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto text-nowrap">
              <!-- <b-nav-dropdown right>
                <template v-slot:button-content>
                  <span>
                    <i class="iconfont">&#xec0f;</i>langua
                  </span>
                </template>
                <b-dropdown-item>
                  <i class="iconfont">&#xebe2;</i>中文
                </b-dropdown-item>
                <b-dropdown-item>
                  <i class="iconfont">&#xebe0;</i>En
                </b-dropdown-item>
              </b-nav-dropdown> -->
              <!-- <b-nav-item>
              <socket-state />
            </b-nav-item>
              -->
              <b-nav-dropdown right>
                <template v-slot:button-content>
                  <span>
                    <socket-state />
                    <i class="iconfont">&#xeb8d;</i>
                    {{ $auth.user }}
                  </span>
                </template>
                <b-dropdown-item :to="{ name: 'user-reset' }">
                  <i class="iconfont">&#xebe3;</i>修改密码
                </b-dropdown-item>
                <b-dropdown-divider />
                <b-dropdown-item @click="logout">
                  <i class="iconfont">&#xe641;</i>退出登录
                </b-dropdown-item>
              </b-nav-dropdown>
            </b-navbar-nav>
          </b-collapse>
        </div>
      </div>
    </b-navbar>
    <b-container class="container-h flex-grow-1" fluid>
      <b-row class="h-100 border-top">
        <b-col md="2" class="bg-dark d-flex flex-column p-4 text-light">
          <h6>
            <b-link to="/root" class="text-decoration-none text-light">Home</b-link>
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
    </b-container>
  </div>
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
  layout: "manage",
  components: { VeLine, VePie, VeHistogram, VeGauge },
  key(route) {
    return route.fullPath
  },
  data() {
    return {
      nav: {
        基础数据: [
          {
            to: { name: "root-node-Terminal" },
            text: "终端状态",
            ico: "\uEB63"
          },
          { to: { name: "root-node-user" }, text: "用户", ico: "\uEB6f" },
          {
            to: { name: "root-node-userSetup" },
            text: "用户设置",
            ico: "\uEB66"
          }
        ] as navi[],
        Socket: [
          { to: { name: "root-socket-node" }, text: "节点", ico: "\uEB64" },
          { to: { name: "root-socket-user" }, text: "用户", ico: "\uEB6f" }
        ] as navi[],
        log: [
          { to: { name: "root-log-node" }, text: "节点", ico: "\uEB64" },
          { to: { name: "root-log-terminal" }, text: "终端", ico: "\uEB23" },
          { to: { name: "root-log-sms" }, text: "短信", ico: "\uEB8b" },
          { to: { name: "root-log-mail" }, text: "邮件", ico: "\uEB8b" },
          {
            to: { name: "root-log-uartterminaldatatransfinites" },
            text: "告警",
            ico: "\uEB68"
          },
          {
            to: { name: "root-log-userlogins" },
            text: "用户登陆",
            ico: "\uEB6b"
          },
          {
            to: { name: "root-log-userrequsts" },
            text: "用户请求",
            ico: "\uEB8c"
          }
        ] as navi[]
      }
    };
  },
  methods: {
    logout() {
      this.$socket.disconnect();
      this.$auth.logout()
    }
  }
});
</script>
<style scoped>
.navbar-dark,
.navbar-nav,
.nav-link,
.dropdown-toggle span {
  color: aliceblue !important;
}
.container-h {
  height: calc(100% - 57px);
}
</style>