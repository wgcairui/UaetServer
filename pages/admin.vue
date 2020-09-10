<template>
  <div class="h-100 w-100 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="dark" class="align-items-start" sticky>
      <b-navbar-brand>
        <span class="text-center text-light" style="font-size:1rem">LADS云平台管理后台</span>
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
    <b-container class=" container-h flex-grow-1 px-5"  id="admin-content" fluid>
      <nuxt-child/>
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  //layout:"manage",
  key(route) {
    return route.fullPath
  },

  methods: {
    logout() {
      this.$socket.disconnect();
      this.$auth.logout();
      location.reload()
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
.container-h{
  height: calc(100% - 57px);
}
#admin-content::-webkit-scrollbar {
  /* display: none; */
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}
#admin-content::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ada9a9;
}
#admin-content::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}
</style>