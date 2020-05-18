<template>
  <b-container fluid class="p-0 h-100 d-flex flex-column">
    <b-navbar v-if="!isUser" toggleable="lg" type="dark" variant="info" class="align-items-start">
      <b-navbar-brand>
        <i class="iconfont">&#xebd0;</i>Ladis
      </b-navbar-brand>
      <div class="navber-m-2 ml-auto">
        <div class="navber-m-3 float-right d-inline-flex flex-column head-right">
          <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
          <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
            <b-navbar-nav class="ml-auto text-nowrap">
              <b-nav-item>
                <socket-state />
              </b-nav-item>
              <b-nav-item>
                <span>
                  <i class="iconfont">&#xeb8d;</i>
                  {{ $auth.user }}
                </span>
              </b-nav-item>
            </b-navbar-nav>
          </b-collapse>
        </div>
      </div>
    </b-navbar>

    <my-nav v-else :back="false"></my-nav>
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
import { WebInfo } from "../store/DB";
export default vue.extend({
  scrollToTop: true,
  data() {
    return {
      isUser: true
    };
  },
  computed: {
    Infos() {
      return (this.$store.state.Infos as WebInfo[]) || [];
    }
  },
  methods: {
    logout() {
      this.$socket.disconnect();
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
