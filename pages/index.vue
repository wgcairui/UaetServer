<template>
  <b-container fluid class="m-0 p-0 h-100 d-flex flex-column">
    <b-row no-gutters style="height:56px">
      <b-navbar
        toggleable="lg"
        type="dark"
        variant="info"
        fixed="top"
        class=" align-items-start"
      >
        <b-navbar-brand>Ladis</b-navbar-brand>
        <div class="navber-m-2 ml-auto">
          <div
            class="navber-m-3 float-right d-inline-flex flex-column head-right"
          >
            <b-navbar-toggle
              target="nav-collapse"
              class="float-right head-btn"
            ></b-navbar-toggle>
            <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
              <!-- Right aligned nav items -->
              <b-navbar-nav class="ml-auto text-nowrap">
                <b-nav-item>
                  <span class="text-light text-wrap"><i></i>告警管理</span>
                </b-nav-item>
                <b-nav-item>
                  <span class="text-light text-wrap"><i></i>设备管理</span>
                </b-nav-item>
                <b-nav-dropdown
                  right
                  text="languga"
                  class=" language-text-light"
                >
                  <b-dropdown-item>中文</b-dropdown-item>
                  <b-dropdown-item>En</b-dropdown-item>
                </b-nav-dropdown>
                <b-nav-dropdown right>
                  <template v-slot:button-content>
                    &#x1f50d;<span>{{ $auth.user }}</span>
                  </template>
                  <b-dropdown-item>用户详情</b-dropdown-item>
                  <b-dropdown-item>修改密码</b-dropdown-item>
                  <b-dropdown-divider></b-dropdown-divider>
                  <b-dropdown-item @click="$auth.logout('local')">退出登录</b-dropdown-item>
                </b-nav-dropdown>
              </b-navbar-nav>
            </b-collapse>
          </div>
        </div>
      </b-navbar>
    </b-row>
    <b-row no-gutters class="main-default main-page h-100 overflow-auto">
      <transition>
        <keep-alive exclude="chartline,devs">
          <nuxt />
        </keep-alive>
      </transition>
    </b-row>
    <b-row no-gutters>
      <b-nav fill class="bg-info w-100">
        <b-nav-item>
          <span class="text-light">UPS</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">Air</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">Em</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">IO</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">Th</span>
        </b-nav-item>
      </b-nav>
    </b-row>
  </b-container>
</template>

<script>
export default {};
</script>
<style scoped>
.main-default {
  flex: 1 0 auto;
}
@media screen and (max-height: 330px) {
  .main-page {
    max-height: calc(100vh - 136px);
  }
}
.main-page {
  max-height: calc(100vh - 96px);
}

.navbar-dark .navbar-nav .nav-link>span{
  color: aliceblue;
}
</style>
