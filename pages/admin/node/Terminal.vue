<template>
  <my-page-user title="透传终端运行状态" :isUser="false">
    <b-row class="my-5">
      <b-col>
        <b-card>
          <b-table responsive :items="Terminals" :fields="fields" striped>
            <template v-slot:cell(mountDevs)="row">
              <b-button
                size="sm"
                @click="row.toggleDetails"
                v-if="row.value"
              >{{row.detailsShowing ? '收起':'展开'}}</b-button>
            </template>
            <template v-slot:row-details="row">
              <b-table :items="row.item.mountDevs" :fields="childFields"></b-table>
            </template>
          </b-table>
        </b-card>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import { BvTableFieldArray } from "bootstrap-vue";
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      Terminals: [],
      fields: [
        { key: "name", label: "别名" },
        { key: "DevMac", label: "设备ID" },
        { key: "mountNode", label: "挂载节点", sortable: true },
        { key: "ip", label: "上线IP" },
        { key: "jw", label: "上线地址" },
        { key: "uptime", label: "上线时间" },
        { key: "mountDevs", label: "挂载设备" }
      ] as BvTableFieldArray,
      childFields: [
        { key: "Type", label: "设备类型" },
        { key: "mountDev", label: "设备型号" },
        { key: "protocol", label: "协议" },
        { key: "pid", label: "地址" }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    Terminals: {
      query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
            ip
            port
            jw
            uptime
            mountNode
            mountDevs {
              Type
              mountDev
              protocol
              pid
            }
          }
        }
      `
    }
  }
});
</script>