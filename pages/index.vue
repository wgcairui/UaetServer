<template>
  <my-page-user :back="false">
    <b-container class="flex-grow-1 overflow-auto">
      <b-row id="uart" class="my-4">
        <separated title="透传设备" />
        <b-col v-for="(link, key) in BindDevice.UTs" :key="key" cols="12" md="6" class="mt-4">
          <b-card>
            <b-link
              :to="{ name: 'uart', query: { DevMac: link.DevMac } }"
              class="text-decoration-none text-dark"
            >
              <b-card-title>
                <i class="iconfont">&#xec4a;</i>
                {{ link.name }}
              </b-card-title>
              <b-card-sub-title>&nbsp;&nbsp;{{ link.DevMac }}</b-card-sub-title>
            </b-link>
            <b-card-body>
              <i class="iconfont">&#xec24;</i>
              <span>
                <b-button
                  variant="link"
                  v-for="val in link.mountDevs"
                  :key="val.mountDev"
                  class="text-dark"
                  @click="toDev(link.DevMac,val.pid,val.mountDev,val.protocol,val.Type)"
                >
                  {{
                  val.mountDev+val.pid
                  }}
                </b-button>
              </span>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row id="ECs">
        <separated title="环控设备" />
        <b-col v-for="(link, key) in BindDevice.ECs" :key="key" cols="12" md="6" class="mt-4">
          <b-link
            :to="{ name: 'ec', query: { ECid: link.ECid } }"
            class="text-decoration-none text-dark"
          >
            <b-card>
              <b-card-title>
                <i class="iconfont">&#xebd8;</i>
                {{ link.name }}
              </b-card-title>
              <b-card-sub-title>&nbsp;{{ link.ECid }}</b-card-sub-title>
              <b-card-body>
                <i class="iconfont">&#xeb63;</i>
                <span>{{ link.model }}</span>
              </b-card-body>
            </b-card>
          </b-link>
        </b-col>
      </b-row>
    </b-container>
    <template v-slot:footer>
      <div class="mt-auto w-100">
        <b-nav fill class="bg-info">
          <b-nav-item href="#ECs">
            <span class="text-light">环控</span>
          </b-nav-item>
          <b-nav-item href="#uart">
            <span class="text-light">透传</span>
          </b-nav-item>
        </b-nav>
      </div>
    </template>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BindDevice } from "../server/bin/interface";
export default Vue.extend({
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
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
      `,
      result: function(data) {
        const BindDevice = data.data.BindDevice as BindDevice;
        if (
          !BindDevice ||
          (BindDevice.UTs.length === 0 && BindDevice.ECs.length === 0)
        )
          this.$router.push("/user/DevManage");
      }
    }
  },
  methods: {
    toDev(
      DevMac: string,
      pid: string,
      mountDev: string,
      protocol: string,
      Type: string
    ) {
      const query = { DevMac, pid, mountDev, protocol };
      switch (Type) {
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
    }
  }
});
</script>
