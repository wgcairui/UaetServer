<template>
  <div class="h-100 w-100 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="info" class="align-items-start" sticky>
      <b-navbar-brand>
        <span v-if="back">
          <b-button variant="link" class="m-0 p-0 text-decoration-none" @click="$router.go(-1)">
            <i class="iconfont text-light">&#xe641;</i>
          </b-button>
          <span class="text-light">|</span>
        </span>
        <span class="text-center text-light" style="font-size:1.1rem">{{ title }}</span>
      </b-navbar-brand>
      <div class="navber-m-2 ml-auto">
        <div class="navber-m-3 float-right d-inline-flex flex-column head-right">
          <b-navbar-toggle target="nav-collapse" class="float-right head-btn" />
          <b-collapse id="nav-collapse" is-nav class="float-rigth mr-1">
            <!-- Right aligned nav items -->
            <b-navbar-nav class="ml-auto text-nowrap">
              <b-nav-dropdown right v-if="isUser">
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
              <b-nav-item v-if="isUser">
                <span class="text-light text-wrap" v-b-toggle.alarms>
                  <i class="iconfont">&#xeb68;</i>告警管理
                </span>
              </b-nav-item>
              <b-nav-item :to="{ name: 'user-DevManage' }" v-if="isUser">
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
      <b-sidebar
        id="alarms"
        title="Alarm"
        right
        bg-variant="dark"
        text-variant="light"
        v-if="isUser"
      >
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
    </b-navbar>
    <b-container class="mb-5 flex-grow-1">
      <slot />
    </b-container>
    <footer class="mt-auto">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { WebInfo } from "../store/DB";
import gql from "graphql-tag";
import { Terminal } from "../server/bin/interface";
export default Vue.extend({
  props: {
    title: {
      default: "Ladis",
      type: String
    },
    back: {
      default: true,
      type: Boolean
    },
    isUser: {
      default: true,
      type: Boolean
    }
  },
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  computed: {
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
          this.$router.push({ name: "uart-th", query });
          break;
        case "空调":
          this.$router.push({ name: "uart-air", query });
          break;
        case "电量仪":
          this.$router.push({ name: "uart-em", query });
          break;
        case "UPS":
          this.$router.push({ name: "uart-ups", query });
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
        //console.log({ userGroup, name });
        if (userGroup === "user" && /(^index|^uart*|^user*)/.test(name)) return;
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