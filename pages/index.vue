<template>
  <b-container fluid class="p-0 h-100 d-flex flex-column">
    <b-navbar
      toggleable="lg"
      type="dark"
      variant="info"
      class="align-items-start"
    >
      <b-navbar-brand> <i class="iconfont">&#xebd0;</i>Ladis </b-navbar-brand>
      <div class="navber-m-2 ml-auto">
        <div
          class="navber-m-3 float-right d-inline-flex flex-column head-right"
        >
          <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
          <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto text-nowrap">
              <b-nav-item v-if="isUser" :to="{ name: 'manage-AlarmManage' }">
                <span class="text-light text-wrap">
                  <i class="iconfont">&#xeb68;</i>告警管理
                </span>
              </b-nav-item>
              <b-nav-item v-if="isUser" :to="{ name: 'manage-DevManage' }">
                <span class="text-light text-wrap">
                  <i class="iconfont">&#xebd8;</i>设备管理
                </span>
              </b-nav-item>

              <b-nav-dropdown right>
                <template v-slot:button-content>
                  <span> <i class="iconfont">&#xec0f;</i>langua </span>
                </template>
                <b-dropdown-item>
                  <i class="iconfont">&#xebe2;</i>中文
                </b-dropdown-item>
                <b-dropdown-item>
                  <i class="iconfont">&#xebe0;</i>En
                </b-dropdown-item>
              </b-nav-dropdown>
              <b-nav-item>
               <b-spinner
                  :variant="$socket.connected ? 'light' : 'dark'"
                  v-b-tooltip.hover
                  small
                  type="grow"
                  :title="
                    $socket.connected
                      ? 'WebSocket连接正常'
                      : 'WebSocket连接断开'
                  "
                ></b-spinner>
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
    </b-navbar>

    <b-row no-gutters class="flex-grow-1 main-page">
      <transition>
        <nuxt />
      </transition>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import gql from "graphql-tag";
import vue from "vue";
import { DollarApollo } from "vue-apollo/types/vue-apollo";
import { WebInfo } from "../store";
export default vue.extend({
  scrollToTop:true,
  data() {
    return {
      isUser: true
    };
  },
  computed: {
    Info() {
      return this.$store.state.Info as WebInfo;
    }
  },
  watch: {
    Info(newValue: WebInfo, oldValue) {
      this.$bvToast.toast(newValue.msg, { title: newValue.type });
    }
  },
  methods: {
    logout() {
      console.log(this.$socket);
      
      this.$socket.client.close();
      this.$auth.logout();
    }
  },
  created() {
    
    // 判断登录类型
    (this as any).$axios.post("/api/auth/userGroup").then((el: any) => {
      switch (el.data.userGroup) {
        case "admin":
          this.isUser = false;
          this.$router.push({ name: "index-tool" });
          break;
        case "root":
          this.isUser = false;
          this.$router.push({ name: "index-admin" });
          break;
        default:
          this.isUser = true;
          this.$router.push({ name: "index-uart" });
          break;
      }
    });
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
.main-page {
  height: calc(100vh - 57px);
}
</style>
