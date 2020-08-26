<template>
  <b-container fluid class="h-100 p-0 d-flex flex-column">
    <b-navbar toggleable="lg" type="dark" variant="dark" class="align-items-start" sticky>
      <b-navbar-brand>
        <nuxt-link to="/main">
          <span class="text-center text-light" style="font-size:1.4rem">LADS</span>
        </nuxt-link>
      </b-navbar-brand>
      <b-nav-toggle target="user-nav" class="m-1"></b-nav-toggle>
      <b-collapse id="user-nav" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-dropdown split right>
            <template v-slot:button-content>
              <span>
                <i class="iconfont">&#xebd0;</i>设备列表
              </span>
            </template>
            <b-dropdown-item
              v-for="val in mountDev"
              :key="val.text"
              @click="toDev(val)"
              v-b-tooltip.hover
              :title="val.remark"
            >
              {{val.text}}
              <b-spinner small :variant="val.state" type="grow" />
            </b-dropdown-item>
          </b-nav-dropdown>
          <b-nav-item v-b-toggle.alarms>
            <span class="text-light text-wrap">
              <i class="iconfont">&#xeb68;</i>告警管理
            </span>
          </b-nav-item>
          <b-nav-item :to="{ name: 'main-DevManage' }">
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
                <i class="iconfont">&#xeb8d;</i>
                {{ $auth.user }}
              </span>
            </template>
            <b-dropdown-item :to="{ name: 'main-userInfo' }">
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
    <b-sidebar id="alarms" title="告警" right bg-variant="dark" text-variant="light">
      <b-button
        variant="link"
        class="bg-dark text-light text-decoration-none text-center"
        block
        :to="{name:'main-AlarmManage'}"
      >查看所有告警信息</b-button>
      <b-list-group>
        <b-list-group-item
          v-for="(info,key) in Infos"
          :key="info.time+key"
          class="bg-dark text-light"
          :to="{name:'main-AlarmManage',params:info}"
        >{{info.msg}}</b-list-group-item>
      </b-list-group>
    </b-sidebar>
    <b-row class="body-row flex-grow-1 user-body" no-gutters>
      <nuxt-child :key="key" class="h-100 overflow-auto user-content p-4" />
      <b-col cols="0" xl="3" class="h-100 overflow-auto user-content p-4 d-none d-xl-block">
        <h5>
          <b>最新告警信息</b>
        </h5>
        <b-list-group>
          <b-list-group-item
            v-for="val in alarm"
            :key="val._id"
            v-b-tooltip.hover
            :title="new Date(val.timeStamp).toLocaleString()"
            :to="{name:'main-AlarmManage',params:{msg:val.msg}}"
          >
            {{`${val.mac}/${val.pid}/${val.devName||''}${val.msg}`}}
            <b-badge v-if="!val.isOk" class="float-right">未确认</b-badge>
          </b-list-group-item>
        </b-list-group>
      </b-col>
    </b-row>
  </b-container>
</template>
<script lang="ts">
import Vue from "vue";
import { WebInfo } from "../store/DB";
import gql from "graphql-tag";
import { Terminal } from "uart";
export default Vue.extend({
  scrollToTop: true,
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: []
      },
      alarm: []
    };
  },
  computed: {
    key() {
      return this.$route.fullPath
    },
    Infos() {
      return ((this.$store as any).state.Infos as WebInfo[]) || [];
    },
    mountDev() {
      const terminals = (this as any).BindDevice?.UTs as Terminal[];
      let result: any[] = [];
      if (terminals) {
        result = terminals.filter(el => el.mountDevs)
          .map(el => {
            let state = 'success'
            let remark = '设备在线'
            if (!el.online) {
              state = "warning"
              remark = "DTU离线"
            }
            return el.mountDevs.map(els => {
              if (state !== "warning" && !els.online) {
                state = "danger"
                remark = "设备超时"
              }
              return {
                DevMac: el.DevMac,
                pid: els.pid,
                state,
                remark,
                mountDev: els.mountDev,
                protocol: els.protocol,
                type: els.Type,
                text: `${el.name}-${els.pid}-${els.mountDev}`
              }
            });
          })
          .flat()
      }
      return result
    }
  },
  methods: {
    toDev(val: { DevMac: string; pid: number; mountDev: string; protocol: string; type: string; }) {
      const query = { DevMac: val.DevMac, pid: String(val.pid), mountDev: val.mountDev, protocol: val.protocol };
      this.$router.push({ name: "main-device", query });
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
              online
              ip
              mountDevs {
                Type
                online
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
      `,
      pollInterval: 10000,
      result: function ({ data }) {
        // console.log(data.BindDevice);
        const BindDevice = data.BindDevice
        if (!BindDevice || BindDevice.UTs?.length === 0) this.$router.push({ name: "main-DevManage" });
        this.$store.commit("updateBindDev", data.BindDevice)
      }
    },
    alarm: {
      query: gql`
        query loguartterminaldatatransfinites($start: Date, $end: Date) {
          alarm: loguartterminaldatatransfinites(start: $start, end: $end)
        }
      `,
      variables: { start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00", end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59" },
      pollInterval: 60000
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
@media (max-width: 568px) {
  .navbar {
    position: fixed;
    width: 100%;
    z-index: 1000;
  }
  .user-body {
    margin-top: 65px;
  }
}
.body-row {
  height: calc(100% - 59px);
}
/* 
HTML 滚动条样式修改
https://www.cnblogs.com/polly-ling/p/9875112.html
*/
.user-content::-webkit-scrollbar {
  /* display: none; */
  width: 6px; /*高宽分别对应横竖滚动条的尺寸*/
  height: 1px;
}
.user-content::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 10px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: #ada9a9;
}
.user-content::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  background: #ededed;
}
</style>