<template>
  <b-container fluid class=" p-0 h-100 d-flex flex-column">
    
      <b-navbar
        toggleable="lg"
        type="dark"
        variant="info"
        class=" align-items-start"
      >
        <b-navbar-brand><i class="iconfont">&#xebd0;</i>Ladis</b-navbar-brand>
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
                <b-nav-item :to="{name:'manage-AlarmManage'}">
                  <span class="text-light text-wrap"
                    ><i class=" iconfont">&#xeb68;</i>告警管理</span
                  >
                </b-nav-item>
                <b-nav-item :to="{name:'manage-DevManage'}">
                  <span class="text-light text-wrap"
                    ><i class="iconfont">&#xebd8;</i>设备管理</span
                  >
                </b-nav-item>
                <b-nav-dropdown right>
                  <template v-slot:button-content>
                    <span><i class="iconfont">&#xec0f;</i>langua</span>
                  </template>
                  <b-dropdown-item
                    ><i class="iconfont">&#xebe2;</i>中文</b-dropdown-item
                  >
                  <b-dropdown-item
                    ><i class="iconfont">&#xebe0;</i>En</b-dropdown-item
                  >
                </b-nav-dropdown>
                <b-nav-dropdown right>
                  <template v-slot:button-content>
                    <span
                      ><i class="iconfont">&#xeb8d;</i>{{ $auth.user }}</span
                    >
                  </template>
                  <b-dropdown-item :to="{ name: 'user-info' }"
                    ><i class="iconfont">&#xeb6b;</i>用户详情</b-dropdown-item
                  >
                  <b-dropdown-item
                    ><i class="iconfont">&#xebe3;</i>修改密码</b-dropdown-item
                  >
                  <b-dropdown-divider></b-dropdown-divider>
                  <b-dropdown-item @click="$auth.logout('local')"
                    ><i class="iconfont">&#xe641;</i>退出登录</b-dropdown-item
                  >
                </b-nav-dropdown>
              </b-navbar-nav>
            </b-collapse>
          </div>
        </div>
      </b-navbar>
    
    <b-row no-gutters class="flex-grow-1">
      <transition>
        
          <nuxt />
      </transition>
    </b-row>
    <b-row no-gutters class=" mt-auto">
      <b-nav fill class="bg-info w-100">
        <b-nav-item>
          <span class="text-light">环控</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">透传</span>
        </b-nav-item>
        </b-nav-item>
      </b-nav>
    </b-row>
  </b-container>
</template>

<script>
export default {};
</script>
<style scoped>
.navbar-dark,
.navbar-nav,
.nav-link,
.dropdown-toggle span {
  color: aliceblue !important;
}
</style>
