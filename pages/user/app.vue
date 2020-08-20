<template>
  <b-container fluid class="d-flex flex-column h-100 p-0">
    <b-row name="header" no-gutters>
      <b-col>
        <header class="d-flex flex-row p-2 shadow-sm">
          <b-img src="https://www.ladishb.com/logo.png"></b-img>
          <b-button variant="link" class="ml-auto text-success">English</b-button>
        </header>
      </b-col>
    </b-row>
    <b-container>
      <b-row class="flex-grow-1 login-body d-flex flex-column" no-gutters>
        <div class="col-12 col-md-4 p-3">
          <b-card v-for="(app,key) in apps" :key="key">
            <b-card-text>{{app.title}}</b-card-text>
            <b-card-sub-title>{{app.explain}}</b-card-sub-title>
            <b-card-body class="d-flex flex-column">
              <span class="my-2">
                适用平台:
                <i>{{app.plaft}}</i>
              </span>
              <span class="my-2">
                程序版本:
                <i>{{app.version}}</i>
              </span>
              <span class="my-2">
                更新日期:
                <i>{{app.updatetime}}</i>
              </span>
              <b-button class="my-2" :href="app.src" size="sm">下载</b-button>
            </b-card-body>
          </b-card>
        </div>
      </b-row>
    </b-container>
  </b-container>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  auth: false,
  data() {
    return {
      apps: [
        {
          title: "ladis透传平台",
          explain: " 适用于android平台上监控透传模块",
          plaft: "android",
          version: "1.0.1",
          updatetime: "2020/7/10",
          src: "https://www.ladishb.com/upload/7132020__ladisuart1.0.1.apk"
        }
      ]
    };
  }
});
</script>