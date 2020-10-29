<template>
  <b-row>
    <b-col class="overflow-auto">
      <b-row class="mb-5">
        <b-col>
          <separated title="终端散布" :back="false">
            <b>{{Terminals.length}}</b>
            <b-icon icon="arrows-fullscreen" @click="full"></b-icon>
          </separated>
          <amap id="admin" ref="admin" class="map" @ready="mapready"></amap>
        </b-col>
      </b-row>
      <b-row>
        <separated title="Server运行状态" :back="false"></separated>
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
        <separated title="服务器状态" :back="false"></separated>
        <b-col>
          <b-table :items="state.syslist" :fields="sysinfoFields"></b-table>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <separated title="节点状态" :back="false"></separated>
          <b-table :items="NodeInfo" :fields="NodeInfoFields" responsive />
        </b-col>
      </b-row>

      <b-row id="useBtyes">
        <b-col>
          <separated title="流量使用(MB)" :back="false">
            <b-select :options="cterminals" v-model="BtyeMac" />
          </separated>
          <ve-line :data="btyes" />
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>
<script lang="ts">
  import Vue from "vue";
  import gql from "graphql-tag";
  import { VeLine, VePie } from "v-charts";
  import { BvTableFieldArray } from "bootstrap-vue";
  import { Terminal, logTerminaluseBytes } from "uart";
  import { gps2AutonaviPosition, API_Aamp_ip2local } from "../../plugins/tools";
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
    components: { VeLine, VePie },
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
          { key: "freemem", label: "空闲内存" },
          {
            key: "loadavg",
            label: "cpu负载(1/5/15min)",
            formatter: (value: number[]) =>
              value.map(el => parseFloat(el.toFixed(2))).join("/ ")
          },
          { key: "type", label: "类型" },
          { key: "uptime", label: "运行时间" },
          { key: "Connections", label: "终端数" },
          {
            key: "updateTime",
            label: "更新时间",
            formatter: value => new Date(value).toLocaleString()
          }
        ] as BvTableFieldArray,
        sysinfoFields: [
          { key: "hostname", label: "服务器名" },
          { key: "usecpu", label: "cpu使用率" },
          { key: "usemen", label: "内存使用率" },
          { key: "totalmem", label: "内存总量" },
          { key: "freemem", label: "空闲内存" },
          {
            key: "loadavg",
            label: "cpu负载(1/5/15min)",
            formatter: (value: number[]) =>
              value.map(el => parseFloat(el.toFixed(2))).join("/ ")
          },
          { key: "uptime", label: "运行时间" },
          {
            key: "version",
            label: "系统版本",
            formatter: (value: string) => value.split(" ")[0].replace("#", "")
          }
        ] as BvTableFieldArray,
        //
        BtyeMac: "",
        logterminaluseBtyes: [] as logTerminaluseBytes[],
        Terminals: [] as Terminal[]
      };
    },
    computed: {
      // 是否是全屏状态
      cterminals() {
        let terminals = this.$data.Terminals as Terminal[];
        if (terminals) {
          terminals = terminals.map<any>(el => ({
            text: el.name,
            value: el.DevMac
          }));
        }
        return terminals || [];
      },
      btyes() {
        const logterminaluseBtyes = this.$data
          .logterminaluseBtyes as logTerminaluseBytes[];
        const btyes = {
          columns: ["date", "useBytes"],
          rows: [] as logTerminaluseBytes[]
        };
        if (logterminaluseBtyes) {
          btyes.rows = logterminaluseBtyes.map(el => {
            el.useBytes = el.useBytes / 1024000;
            return el;
          });
        }
        return btyes;
      },
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
      logterminaluseBtyes: {
        query: gql`
        query logterminaluseBtyes($mac: String) {
          logterminaluseBtyes(mac: $mac)
        }
      `,
        variables() {
          return { mac: this.$data.BtyeMac };
        },
        skip() {
          return this.$data.BtyeMac === "";
        }
      },
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
    `,
      Terminals: {
        query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
          }
        }
      `
      }
    },
    methods: {
      // 全屏
      full() {
        document.documentElement.requestFullscreen()
      },
      // 等待amap地图组件准备好,加载地图mark
      async mapready(map: AMap.Map) {
        const ter = await this.$apollo.query({
          query: gql`
          query Terminals {
            Terminals {
              DevMac
              jw
              ip
              name
              online
            }
          }
        `
        });
        const jws = ter.data.Terminals as Terminal[];
        //https://lbs.amap.com/api/jsapi-v2/guide/overlays/massmarker
        const markArr = jws.map(async ({ jw, ip, name, DevMac, online }) => {
          const position = jw && /[1-9]/.test(jw as string) ? await gps2AutonaviPosition(jw as string, window) : await API_Aamp_ip2local(ip as string);
          const labelMarker = new AMap.LabelMarker({
            name, // 此属性非绘制文字内容，仅最为标识使用
            position,
            zIndex: 16,
            // 将第一步创建的 icon 对象传给 icon 属性
            icon: {
              // 图片 url
              image: require(online ? "~/assets/jw-success.png" : "~/assets/jw-error.png"),
              // 图片尺寸
              size: [48, 48],
              // 图片相对 position 的锚点，默认为 bottom-center
              anchor: 'center',
            },
            // 将第二步创建的 text 对象传给 text 属性
            text: {
              // 要展示的文字内容
              content: name,
              // 文字方向，有 icon 时为围绕文字的方向，没有 icon 时，则为相对 position 的位置
              direction: 'right',
              // 在 direction 基础上的偏移量
              offset: [-15, 0],
              // 文字样式
              style: {
                // 字体大小
                fontSize: 12,
                // 字体颜色
                fillColor: '#0041ff',
                // 描边颜色
                strokeColor: '#fff',
                // 描边宽度
                strokeWidth: 2,
              }
            }
          });
          labelMarker.on('click', (e) => {
            this.$router.push({ name: 'root-node-Terminal', query: { DevMac } })
          });
          return labelMarker
        })
        const labelsLayer = new AMap.LabelsLayer({
          zooms: [3, 30],
          zIndex: 1000,
          // 该层内标注是否避让
          collision: false,
          // 设置 allowCollision：true，可以让标注避让用户的标注
          allowCollision: true,
        });
        (labelsLayer as any).add(await Promise.all(markArr))
        map.add(labelsLayer)

      }
    },
    mounted() {
      document.addEventListener("fullscreenchange", () => {
        console.log("fullscreenchange");
      })
    }
  });
</script>
<style lang="scss">
  .map:fullscreen {
    height: 1080px;
  }
  .map:-webkit-full-screen {
    height: 1080px;
  }
  .map:-moz-full-screen {
    height: 1080px;
  }
  .map {
    height: 860px;
  }
</style>