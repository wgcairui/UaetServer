<template>
  <div class="h-100 w-100 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="info" class="align-items-start" fixed>
      <b-navbar-brand>
        <span class="text-center text-light" style="font-size:1.1rem">LADS</span>
      </b-navbar-brand>

      <b-nav-toggle target="user-nav" class="m-1">
        <template v-slot:default="{ expanded }">
          <b-icon v-if="expanded" icon="chevron-bar-up"></b-icon>
          <b-icon v-else icon="chevron-bar-down"></b-icon>
        </template>
      </b-nav-toggle>
      <b-collapse id="user-nav" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-dropdown right>
            <template v-slot:button-content>
              <span>
                <i class="iconfont">&#xebd0;</i>设备列表
              </span>
            </template>
            <b-dropdown-item
              v-for="val in mountDev"
              :key="val.text"
              @click="toDev(val)"
            >{{val.text}}</b-dropdown-item>
          </b-nav-dropdown>
          <b-nav-item v-b-toggle.alarms>
            <span class="text-light text-wrap">
              <i class="iconfont">&#xeb68;</i>告警管理
            </span>
          </b-nav-item>
          <b-nav-item :to="{ name: 'user-DevManage' }">
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
          <b-nav-dropdown right>
            <template v-slot:button-content>
              <span>
                <!-- <socket-state class="d-sm-block" /> -->
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
    </b-navbar>

    <b-container class="h-100 overflow-auto user-body" id="user-content">
      <nuxt-child :key="key"/>
    </b-container>

    <footer class="mt-auto">
      <slot name="footer"></slot>
    </footer>
    <b-sidebar id="alarms" title="Alarm" right bg-variant="dark" text-variant="light">
      <b-button
        variant="link"
        class="bg-dark text-light text-decoration-none text-center"
        block
        :to="{name:'user-AlarmManage'}"
      >查看所有告警信息</b-button>
      <b-list-group>
        <b-list-group-item
          v-for="(info,key) in Infos"
          :key="info.time+key"
          class="bg-dark text-light"
          :to="{name:'user-AlarmManage',params:info}"
        >{{info.msg}}</b-list-group-item>
      </b-list-group>
    </b-sidebar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { WebInfo } from "../store/DB";
import gql from "graphql-tag";
import { Terminal } from "uart";
export default Vue.extend({
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  computed: {
      key(){
          return this.$route.fullPath
      },
    Infos() {
      return ((this.$store as any).state.Infos as WebInfo[]) || [];
    },
    mountDev() {
      const terminals = (this as any).BindDevice?.UTs as Terminal[];
      return terminals
        ? terminals
            .filter(el => el.mountDevs)
            .map(el => {
              return el.mountDevs.map(els => ({
                DevMac: el.DevMac,
                pid: els.pid,
                mountDev: els.mountDev,
                protocol: els.protocol,
                type: els.Type,
                text: `${el.name}-${els.pid}-${els.mountDev}`
              }));
            })
            .flat()
        : [];
    }
  },
  methods: {
    toDev(val: {
      DevMac: string;
      pid: number;
      mountDev: string;
      protocol: string;
      type: string;
    }) {
      const query = {
        DevMac: val.DevMac,
        pid: String(val.pid),
        mountDev: val.mountDev,
        protocol: val.protocol
      };
      switch (val.type) {
        case "温湿度":
          this.$router.push({ name: "main-dev-th", query });
          break;
        case "空调":
          this.$router.push({ name: "main-dev-air", query });
          break;
        case "电量仪":
          this.$router.push({ name: "main-dev-em", query });
          break;
        case "UPS":
          this.$router.push({ name: "main-dev-ups", query });
          break;
      }
    },
    logout() {
      this.$socket.disconnect();
      this.$auth.logout();
    }
  },
  apollo: {
    BindDevice: {
      query: gql`
        query getUserBindDevice {
          BindDevice {
            UTs {
              DevMac
              name
              mountDevs {
                Type
                mountDev
                protocol
                pid
              }
            }
            ECs {
              ECid
              name
              model
            }
          }
        }
      `
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
        if (userGroup === "user" && /(^index|^uart*|^user*)/.test(name)) return;
        switch (userGroup) {
          case "admin":
            this.$router.push({ name: "manage" });
            break;
          case "root":
            this.$router.push({ name: "admin" });
            break;
          default:
            this.$router.push({name:"main"});
            break;
        }
      });
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
@media (max-width: 568px) {
  .navbar {
    position: fixed;
    width: 100%;
    z-index: 1000;
  }
  .user-body {
    margin-top: 56px;
  }
}
/* 
HTML 滚动条样式修改
https://www.cnblogs.com/polly-ling/p/9875112.html
*/
#user-content::-webkit-scrollbar {
  /* display: none; */
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}
#user-content::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ada9a9;
}
#user-content::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}
</style>