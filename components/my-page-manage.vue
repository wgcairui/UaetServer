<template>
  <div class="h-100 w-100 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="info" class="align-items-start">
      <b-navbar-brand>
        <span v-if="back">
          <b-button variant="link" class="m-0 p-0 text-decoration-none" @click="$router.go(-1)">
            <i class="iconfont text-light">&#xe641;</i>
          </b-button>
          <span class="text-light">|</span>
        </span>
        <span class="text-center text-light" style="font-size:1rem">{{ title }}</span>
      </b-navbar-brand>
      <div class="navber-m-2 ml-auto">
        <div class="navber-m-3 float-right d-inline-flex flex-column head-right">
          <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
          <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto text-nowrap">
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
                <b-dropdown-item :to="{ name: 'user-info' }">
                  <i class="iconfont">&#xeb6b;</i>用户详情
                </b-dropdown-item>
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
    <b-container class=" container-h flex-grow-1" fluid>
      <slot />
    </b-container>
    <footer class="mt-auto">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  layout:"manage",
  props: {
    title: {
      default: "Ladis",
      type: String
    },
    back: {
      default: true,
      type: Boolean
    }
  },
  methods: {
    logout() {
      this.$socket.disconnect();
      this.$auth.logout();
      location.reload()
    }
  },
  beforeCreate() {
    this.$apollo
      .query({
        query: gql`
          {
            userGroup
          }
        `
      })
      .then(el => {
        const userGroup = el.data.userGroup;
        const name = this.$route.name as string;
        // console.log({ userGroup, name });
        if (userGroup !== "user" && !/(^index|^uart*|^user*)/.test(name)) return;
        switch (userGroup) {
          case "admin":
            this.$router.push({ name: "manage" });
            break;
          case "root":
            this.$router.push({ name: "admin" });
            break;
          default:
            this.$router.push("/");
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
.container-h{
  height: calc(100% - 57px);
}
</style>