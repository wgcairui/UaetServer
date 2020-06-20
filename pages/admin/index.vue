<template>
  <b-row class="h-100">
    <b-col class="overflow-auto h-100">
      <b-row>
        <separated title="Server运行状态"></separated>
        <b-col md="4">
          <ve-pie :data="state.user" />
        </b-col>
        <b-col md="4">
          <ve-pie :data="state.node" />
        </b-col>
        <b-col md="4">
          <ve-pie :data="state.terminal" />
        </b-col>
        <b-col>
          <ve-line :data="sysinfo" :settings="sysinfoSetting"></ve-line>
        </b-col>
      </b-row>
      <b-row>
        <separated title="服务器状态"></separated>
        <b-col>
          <b-table :items="state.syslist"></b-table>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <separated title="节点列表"></separated>
          <b-table :items="NodeInfo" :fields="NodeInfoFields" responsive>
            <template v-slot:cell(loadavg)="row">
              <i>{{ row.value.map(el => parseFloat(el.toFixed(2))).join("/ ") }}</i>
            </template>
            <template v-slot:cell(updateTime)="row">{{ new Date(row.value).toLocaleString()}}</template>
          </b-table>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { VeLine, VePie, VeHistogram, VeGauge } from "v-charts";
interface navi {
  to: { name: string };
  text: string;
  ico: string;
}
interface runstate {
  online: number;
  all: number;
}
export default Vue.extend({
  components: { VeLine, VePie, VeHistogram, VeGauge },

  data() {
    return {
      //
      runingState: {},
      sysinfoSetting: {
        labelMap: {
          usemen: "内存使用率",
          usecpu: "cpu使用率"
        }
      },
      NodeInfo: [],
      NodeInfoFields: [
        { key: "NodeName", label: "节点名称" },
        { key: "totalmem", label: "节点内存" },
        { key: "freemem", label: "可用内存" },
        { key: "loadavg", label: "负载(1/5/15min)" },
        { key: "type", label: "类型" },
        { key: "uptime", label: "运行时间" },
        { key: "Connections", label: "终端数" },
        { key: "updateTime", label: "更新时间" }
      ]
    };
  },
  computed: {
    state() {
      const runingState = this.$data.runingState as any;
      const user = {
        columns: ["类型", "num"],
        rows: [] as any[]
      };
      //
      if (runingState?.hasOwnProperty("User")) {
        const statUser = <runstate>runingState.User;
        user.rows.push({
          类型: "在线用户-" + statUser.online,
          num: statUser.online
        });
        user.rows.push({
          类型: "离线用户-" + (statUser.all - statUser.online),
          num: statUser.all - statUser.online
        });
      }
      const node = {
        columns: ["类型", "num"],
        rows: [] as any[]
      };
      if (runingState?.hasOwnProperty("Node")) {
        const statUser = <runstate>runingState.Node;
        node.rows.push({
          类型: "在线节点-" + statUser.online,
          num: statUser.online
        });
        node.rows.push({
          类型: "离线节点-" + (statUser.all - statUser.online),
          num: statUser.all - statUser.online
        });
      }
      const terminal = {
        columns: ["类型", "num"],
        rows: [] as any[]
      };
      if (runingState?.hasOwnProperty("Terminal")) {
        const statUser = <runstate>runingState.Terminal;
        terminal.rows.push({
          类型: "在线终端-" + statUser.online,
          num: statUser.online
        });
        terminal.rows.push({
          类型: "离线终端-" + (statUser.all - statUser.online),
          num: statUser.all - statUser.online
        });
      }

      const syslist = [];
      if (runingState?.hasOwnProperty("SysInfo")) {
        const info = runingState.SysInfo;

        syslist.push(info);
        let sysinfoArray = this.$data.sysinfoArray as any[];
        this.$store.commit("addSysInfo", {
          time: new Date().toLocaleTimeString(),
          usecpu: info.usecpu,
          usemen: info.usemen
        });
      }
      return { user, node, terminal, syslist };
    },
    sysinfo() {
      const sysinfoArray = this.$store.state.SysInfos;
      return {
        columns: ["time", "usecpu", "usemen"],
        rows: sysinfoArray
      };
    }
  },
  apollo: {
    runingState: {
      query: gql`
        query runingState {
          runingState
        }
      `,
      pollInterval: 10000
    },
    NodeInfo: gql`
      {
        NodeInfo {
          updateTime
          hostname
          totalmem
          freemem
          loadavg
          type
          uptime
          NodeName
          Connections
          SocketMaps {
            mac
            port
            ip
            jw
          }
        }
      }
    `
  }
});
</script>
