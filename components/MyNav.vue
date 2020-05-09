<template>
  <b-navbar toggleable="lg" type="dark" variant="info" class="align-items-start">
    <div class="navber-m-2 ml-auto">
      <div class="navber-m-3 float-right d-inline-flex flex-column head-right">
        <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
        <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
          <!-- Right aligned nav items -->
          <b-navbar-nav class="ml-auto text-nowrap">
            <b-nav-item>
              <span class="text-light text-wrap" v-b-toggle.alarms>
                <i class="iconfont">&#xeb68;</i>告警管理
              </span>
            </b-nav-item>
            <b-nav-item :to="{ name: 'manage-DevManage' }">
              <span class="text-light text-wrap">
                <i class="iconfont">&#xebd8;</i>设备管理
              </span>
            </b-nav-item>

            <b-nav-dropdown right>
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
            </b-nav-dropdown>
            <b-nav-item>
              <socket-state />
            </b-nav-item>

            <b-nav-dropdown right>
              <template v-slot:button-content>
                <span>
                  <i class="iconfont">&#xeb8d;</i>
                  {{ $auth.user }}
                </span>
              </template>
              <b-dropdown-item :to="{ name: 'user-info' }">
                <i class="iconfont">&#xeb6b;</i>用户详情
              </b-dropdown-item>
              <b-dropdown-item>
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
    <b-sidebar id="alarms" title="Alarm" right bg-variant="dark" text-variant="light">
      <b-button
        variant="link"
        class="bg-dark text-light text-decoration-none text-center"
        block
        :to="{name:'manage-AlarmManage'}"
      >查看所有告警信息</b-button>
      <b-list-group>
        <b-list-group-item
          v-for="info in Infos"
          :key="info.time"
          class="bg-dark text-light"
          :to="{name:'manage-AlarmManage',params:info}"
        >{{info.msg}}</b-list-group-item>
      </b-list-group>
    </b-sidebar>
  </b-navbar>
</template>
<script lang="ts">
import Vue from "vue";
import { WebInfo } from "../store/DB";
export default Vue.extend({
  computed: {
    Infos() {
      return ((this.$store as any).state.Infos as WebInfo[]) || [];
    }
  },
  methods: {
    logout() {
      this.$socket.disconnect();
      this.$auth.logout();
    }
  }
});
</script>
<style scoped>
.loginTitle {
  height: 57px;
}
.navbar-dark,
.navbar-nav,
.nav-link,
.dropdown-toggle span {
  color: aliceblue !important;
}
</style>