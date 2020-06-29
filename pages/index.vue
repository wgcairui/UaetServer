<template>
  <my-page-user :back="false">
    <b-row id="uart">
      <separated title="透传设备">
        <b-input v-model="uartFilter" placeholder="搜索数据" size="sm"></b-input>
      </separated>
      <b-col
        v-for="(link, key) in uts"
        :key="key+link.name"
        cols="12"
        md="6"
        class="mt-4"
        v-b-tooltip.hover
        :title="`状态:${link.online?'在线':'离线'},IP:${link.ip}`"
      >
        <b-card class="shadow">
          <b-link
            :to="{ name: 'uart', query: { DevMac: link.DevMac } }"
            class="text-decoration-none text-dark"
          >
            <b-card-title class="d-flex align-items-center">
              <i class="iconfont">&#xec4a;</i>
              {{ link.name }}&nbsp;&nbsp;
              <b-spinner small :variant="link.online?'success':'warning'" type="grow" />
            </b-card-title>
            <b-card-sub-title>&nbsp;&nbsp;{{ link.DevMac }}</b-card-sub-title>
          </b-link>
          <b-card-body class="d-flex flex-row">
            <i class="iconfont" style="padding-top:7px">&#xec24;</i>
            <span v-if="link.mountDevs">
              <b-button
                variant="link"
                v-for="val in link.mountDevs"
                :key="val.mountDev+val.pid"
                class="text-dark"
                @click="toDev(link.DevMac,val.pid,val.mountDev,val.protocol,val.Type)"
              >
                {{
                val.pid+"."+val.mountDev
                }}
              </b-button>
              <b-button
                variant="link"
                v-if="link.mountDevs.length===0"
                :to="{name:'user-addTerminal',query: { DevMac: link.DevMac }}"
              >Add mountDevs</b-button>
            </span>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
    <b-row id="aggregation">
        <separated title="聚合设备">
          <b-input v-model="aggregationFilter" placeholder="搜索数据" size="sm"></b-input>
        </separated>
        <b-col cols="12" md="6" class="mt-4" v-for="(link, key) in agg" :key="key+link.name">
          <b-card class="shadow">
            <b-link
              :to="{ name: 'uart-aggregation', query: { id: link.id } }"
              class="text-decoration-none text-dark"
            >
              <b-card-title>
                <i class="iconfont">&#xeb64;</i>
                {{ link.name }}
              </b-card-title>
              <b-card-sub-title>
                &nbsp;&nbsp;{{ link.id }}
                <b-button variant="link" @click.stop.prevent="aggregationTrash(link.id)">
                  <b-icon-trash></b-icon-trash>
                </b-button>
              </b-card-sub-title>
            </b-link>
            <b-card-body class="d-flex flex-row">
              <i class="iconfont" style="padding-top:7px">&#xec24;</i>
              <span v-if="link.aggregations">
                <b-button
                  variant="link"
                  v-for="val in link.aggregations"
                  :key="val.mountDev+val.pid"
                  class="text-dark"
                  @click="toDev(val.DevMac,val.pid,val.mountDev,val.protocol,val.Type)"
                >
                  {{
                  val.mountDev
                  }}
                </b-button>
                <b-button
                  variant="link"
                  v-if="link.aggregations.length===0"
                  :to="{name:'user-addTerminal',query: { DevMac: link.DevMac }}"
                >Add mountDevs</b-button>
              </span>
            </b-card-body>
          </b-card>
        </b-col>
        <b-col cols="12" md="6" class="mt-4">
          <b-card class="shadow">
            <b-button
              block
              variant="link"
              class="py-5 text-decoration-none text-center"
              style=" font-size:2rem;fontWeight:10"
              v-b-modal.modal-1
            >+</b-button>
          </b-card>
        </b-col>
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
    <b-modal
      id="modal-1"
      title="添加聚合设备"
      centered
      size="lg"
      hide-footer
      header-bg-variant="info"
      header-text-variant="light"
      lazy
      no-stacking
    >
      <b-form class="p-5">
        <my-form label="聚合名称:">
          <b-form-input v-model="aggName"></b-form-input>
        </my-form>
        <my-form label="聚合设备:">
          <b-form-select multiple :options="aggOption" v-model="aggSelects"></b-form-select>
        </my-form>
        <b-button block :disabled="!aggName" size="sm" @click="addAggregation">创建</b-button>
      </b-form>
    </b-modal>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BindDevice, Terminal, AggregationDev } from "../server/bin/interface";
import aggregationVue from "./uart/aggregation.vue";
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
      aggregationFilter: "",
      aggName: "",
      aggSelects: [] as AggregationDev[]
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
    aggOption() {
      const uts = this.$data.BindDevice.UTs as Terminal[];
      const aggOpt = uts
        .map(el => {
          return el.mountDevs.map(el2 => ({
            text: `${el.name}-${el2.pid}-${el2.mountDev}`,
            value: { DevMac: el.DevMac, name: el.name, ...el2 }
          }));
        })
        .flat();
      return aggOpt;
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
              online
              ip
              mountDevs {
                Type
                mountDev
                protocol
                pid
              }
            }
            AGG {
              name
              id
              aggregations {
                DevMac
                name
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
    },
    // 添加虚拟聚合设备
    async addAggregation() {
      const aggDevices = this.aggSelects;
      const aggName = this.aggName;
      const msg = aggDevices.map(el => el.mountDev).join(",");
      const isOk = await this.$bvModal.msgBoxConfirm(
        `是否选择 ${msg} 创建聚合设备:${aggName}`,
        { buttonSize: "sm", okTitle: "确定!", centered: true }
      );
      if (isOk) {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation addAggregation($name: String, $aggs: JSON) {
              addAggregation(name: $name, aggs: $aggs) {
                ok
                msg
              }
            }
          `,
          variables: { name: aggName, aggs: aggDevices }
        });
        this.$apollo.queries.BindDevice.refetch();
      }
    },
    async aggregationTrash(id: string) {
      const isOk = await this.$bvModal.msgBoxConfirm("是否删除聚合设备:" + id, {
        buttonSize: "sm",
        okTitle: "确定!",
        okVariant: "info",
        centered: true
      });
      if (isOk) {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation deleteAggregation($id: String) {
              deleteAggregation(id: $id) {
                ok
                msg
              }
            }
          `,
          variables: { id }
        });
        this.$apollo.queries.BindDevice.refetch();
      }
    }
  }
});
</script>
<style lang="scss" scoped>
.card {
  height: 100%;
}
</style>