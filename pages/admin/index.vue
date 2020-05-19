<template>
  <my-page-user title="Administrator" :isUser="false">
    <b-row>
      <separated title="基础"></separated>
      <b-col v-for="(link, key) in navItem" :key="key" cols="12" md="4">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
    <b-row>
      <separated title="Socket"></separated>
      <b-col v-for="(link, key) in Socket" :key="key" cols="12" md="4">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
    <b-row>
      <separated title="日志"></separated>
      <b-col v-for="(link, key) in log" :key="key" cols="12" md="4">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
interface navi {
  to: { name: string };
  text: string;
  ico: string;
}
export default Vue.extend({
  data() {
    return {
      navItem: [
        { to: { name: "admin-node-Node" }, text: "节点状态", ico: "\uEBD8" },
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
        { to: {}, text: "节点", ico: "\uEB64" },
        { to: {}, text: "用户", ico: "\uEB6f" }
      ] as navi[],
      log: [
        { to: {}, text: "节点", ico: "\uEB64" },
        { to: {}, text: "终端", ico: "\uEB23" },
        { to: {}, text: "短信", ico: "\uEB8b" },
        { to: {}, text: "邮件", ico: "\uEB8b" },
        { to: {}, text: "告警", ico: "\uEB68" },
        { to: {}, text: "用户登陆", ico: "\uEB6b" },
        { to: {}, text: "用户请求", ico: "\uEB8c" }
      ] as navi[]
    };
  }
});
</script>
<style scope>
.ico {
  font-size: 28px;
}
</style>
