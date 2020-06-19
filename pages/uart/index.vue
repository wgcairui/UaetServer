<template>
  <my-page-user :title="'挂载设备:' + DevMac">
    <b-row>
      <separated title="透传终端信息"></separated>
      <b-col cols="12" md="6">
        <b-jumbotron>
          <b-form>
            <b-form-group label="模块ID:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                DevMac
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="模块IP:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.ip
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="模块端口:" v-bind="label">
              <b-form-text class="terminal text-dark">
                {{
                Terminals.port
                }}
              </b-form-text>
            </b-form-group>
            <b-form-group label="GPS定位:" v-bind="label">
              <b-form-text class="terminal text-dark">{{ Terminals.jw || '没有gps信息时以IP模糊定位'}}</b-form-text>
            </b-form-group>
            <b-form-group label="模糊地址:" v-bind="label">
              <b-form-text class="terminal text-dark">{{address}}</b-form-text>
            </b-form-group>
            <b-form-group label="在线状态:" v-bind="label">
              <b-form-checkbox
                switch
                v-model="devState"
                size="lg"
                button-variant="success"
              >{{devState?'在线':'离线'}}</b-form-checkbox>
            </b-form-group>
          </b-form>
        </b-jumbotron>
      </b-col>
      <b-col cols="12" md="6" style="min-height:300px">
        <ve-amap
          :settings="chartSettings"
          :tooltip="{ show: true }"
          :after-set-option-once="afterSet"
        ></ve-amap>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <separated title="挂载"></separated>
        <b-card>
          <!-- <tree
            :data="Terminals"
            node-text="name"
            layout-type="horizontal"
            class="tree"
            :radius="6"
            @clickedNode="treeSelect"
            @clickedText="treeSelect"
          />-->
          <ve-tree :data="chartData" :settings="treeSettings"></ve-tree>
        </b-card>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
// import { tree } from "vued3tree";
import { Terminal, TerminalMountDevs } from "../../server/bin/interface";
import { VeAmap, VeTree } from "v-charts";
import {
  API_Aamp_gps2autoanvi,
  API_Aamp_local2address,
  API_Aamp_address2local,
  API_Aamp_ip2local
} from "../../plugins/tools";
interface selectTree {
  Type: string;
  mountDev: string;
  protocol: string;
  pid: number;
}
export default Vue.extend({
  components: { VeAmap, VeTree },
  data() {
    const label = {
      labelCols: "12",
      labelColsSm: "2",
      labelAlignSm: "right"
    };
    return {
      chartSettings: {
        key: "2bbc666ac8e6a9d69c2910a7053243b6",
        v: "1.4.3",
        amap: {
          resizeEnable: true,
          center: [113.975299479167, 29.924395345053],
          zoom: 15
        }
      },
      address: "",
      //
      treeSettings: {
        seriesMap: {
          tree1: {
            symbol: (this as any).treeSysbol, //pin
            symbolSize: 15,
            label: {
              show: true,
              position: "top",
              fontSize: 16
            }
          }
        }
      },
      //
      label,
      devState: false
    };
  },
  async asyncData({ route, query, app }) {
    const client = app.apolloProvider.defaultClient;
    // 路由query
    const DevMac = query.DevMac;
    const { data } = await client.query({
      query: gql`
        query getUserTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            ip
            port
            jw
            uptime
            mountNode
            mountDevs {
              Type
              name: mountDev
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables: {
        DevMac
      }
    });
    let Terminal: Terminal = data.Terminal;
    // 构建tree对象
    const children = Terminal.mountDevs.map(el =>
      Object.assign(el, { name: el.mountDev + el.pid })
    );
    const Terminals = Object.assign(Terminal, { children });

    const chartData = {
      columns: ["name", "value"],
      rows: [
        {
          name: "tree1",
          value: [Terminals]
        }
      ]
    };
    console.log(Terminals);

    return { chartData, Terminals, DevMac };
  },
  apollo: {
    devState: {
      query: gql`
        query getDevState($mac: String, $node: String) {
          devState: getDevState(mac: $mac, node: $node)
        }
      `,
      variables() {
        return {
          mac: this.$data.DevMac,
          node: this.$data.Terminals.mountNode
        };
      }
      // pollInterval: 1000
    }
  },

  methods: {
    //
    treeSysbol(
      value: Array<any> | number,
      { data }: { data: TerminalMountDevs }
    ) {
      if (!data.Type) return "pin";
      else return 'path://'
    },
    // 修改map
    async afterSet(echarts: any) {
      // 获取页面amap实例
      const amap = echarts
        .getModel()
        .getComponent("amap")
        .getAMap() as AMap.Map;
      const terminal = (this as any).Terminals as Terminal;

      let position = terminal.jw as AMap.LngLat;
      // 如果有gps信息则把gps转换为autonavi坐标,否则根据ip获取模糊定位
      if (position) {
        const gps = (position as any)
          .split(",")
          .map((el: string) => parseFloat(el)) as [number, number];
        position = await new Promise<AMap.LngLat>(res => {
          window.AMap.convertFrom(gps, "gps", (stat, result) => {
            const jws = (result as AMap.convertFrom.Result).locations[0];
            res(jws);
          });
        });
      } else {
        const jws = await API_Aamp_ip2local(terminal.ip as string);
        const gps =
          typeof jws.rectangle === "string"
            ? (jws.rectangle
                .split(";")[0]
                .split(",")
                .map(el => parseFloat(el)) as [number, number])
            : ([0.0, 0.0] as [number, number]);
        position = await new Promise<AMap.LngLat>(res => {
          window.AMap.convertFrom(gps, null, (stat, result) => {
            const jws = (result as AMap.convertFrom.Result).locations[0];
            res(jws);
          });
        });
      }

      amap.setCenter(position);
      amap.add(
        new window.AMap.Marker({
          position
        })
      );
      const address = await API_Aamp_local2address(
        [position.getLng(), position.getLat()].join(",")
      );
      this.$data.address = address.regeocode.formatted_address;
    },
    //
    treeSelect(item: any) {
      const { Type, mountDev, pid, protocol }: selectTree = item.data;
      if (!Type) return;
      const DevMac = <string>this.$route.query.DevMac;
      const query = { DevMac, pid: String(pid), mountDev, protocol };
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
<style>
.terminal {
  font-size: 0.9rem;
  padding-top: 5px;
}
.text-muted {
  color: black !important;
}
.tree {
  min-height: 368px;
}
.treeclass .nodetree text {
  font-size: 18px !important;
  word-wrap: break-word;
}
.custom-control-input:checked ~ .custom-control-label::before {
  color: #fff;
  border-color: #28a745;
  background-color: #28a745;
}
@media (min-width: 576px) {
  .jumbotron {
    padding: 0;
  }
}
.jumbotron {
  padding: 2rem 1rem;
  margin-bottom: 2rem;
  background-color: #e9ecef;
  border-radius: 0.3rem;
}
.bm-view {
  width: 100%;
  height: 100%;
  padding-bottom: 32px;
}
</style>
