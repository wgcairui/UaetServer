<template>
  <my-page-user :back="false">
    <b-container class="flex-grow-1 overflow-auto">
      <b-row id="uart" class="my-4">
        <separated title="透传设备">
          <b-input v-if="uts && uts.length>2" v-model="uartFilter" placeholder="搜索数据" size="sm"></b-input>
        </separated>
        <b-col v-for="(link, key) in uts" :key="key" cols="12" md="6" class="mt-4">
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
                  :key="val.mountDev+val.pid"
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
      <b-row id="aggregation">
        <separated title="聚合设备">
          <b-input v-model="aggregationFilter" placeholder="搜索数据" size="sm"></b-input>
        </separated>
        <!-- <b-col cols="12" md="6">

        </b-col>-->
        <!-- <b-col class="d-flex flex-row flex-wrap">
          <div class="p-3">
            <b-card class="col-12 col-md-6 m-3">ss</b-card>
          </div>

          <div class="p-3">
            <b-card class="col-12 col-md-6" v-for="i in 5" :key="i" title="sdddddddddddd">ss</b-card>
          </div>
        </b-col> -->
      </b-row>
      <!-- <b-row id="ECs">
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
      </b-row>-->
    </b-container>
    <template v-slot:footer>
      <div class="mt-auto w-100">
        <b-nav fill class="bg-info">
          <b-nav-item href="#aggregation">
            <span class="text-light">聚合</span>
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
import { BindDevice, Terminal } from "../server/bin/interface";
export default Vue.extend({
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: [],
        AGG: [],
        user: ""
      },
      uartFilter: "",
      aggregationFilter: ""
    };
  },
  computed: {
    uts() {
      const uts = this.$data.BindDevice.UTs as Terminal[];
      const uartFilter = this.$data.uartFilter as string;
      if (!uartFilter) return uts;
      const regex = new RegExp(uartFilter);
      return uts.filter(el => uartFilter && regex.test(JSON.stringify(el)));
    },
    agg() {
      const uts = this.$data.BindDevice.AGG as any[];
      const aggregationFilter = this.$data.aggregationFilter as string;
      if (!aggregationFilter) return uts;
      const regex = new RegExp(aggregationFilter);
      return uts.filter(
        el => aggregationFilter && regex.test(JSON.stringify(el))
      );
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
