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
              <b-form-text class="terminal text-dark">
                <b-link href="http://www.gzhatu.com/dingwei.html" target="_blank">{{ Terminals.jw }}</b-link>
              </b-form-text>
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
        <baidu-map
          class="bm-view"
          ak="bqZOsTpZOlX780PFinrOXhk0yAnbqUWN"
          :center="center"
          :zoom="zoom"
          @ready="handler"
        >
          <bm-marker :position="center"></bm-marker>
          <bm-map-type :map-types="['BMAP_NORMAL_MAP', 'BMAP_HYBRID_MAP']" anchor="BMAP_ANCHOR_TOP_LEFT"></bm-map-type>
        </baidu-map>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <separated title="挂载"></separated>
        <b-card>
          <tree
            :data="Terminals"
            node-text="name"
            layout-type="horizontal"
            class="tree"
            :radius="6"
            @clickedNode="treeSelect"
            @clickedText="treeSelect"
          />
        </b-card>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { tree } from "vued3tree";
import { Terminal } from "../../server/bin/interface";
import BaiduMap from "vue-baidu-map/components/map/Map.vue";
import BmMarker from "vue-baidu-map/components/overlays/Marker.vue";
import BmMapType from "vue-baidu-map/components/controls/MapType.vue";
interface selectTree {
  Type: string;
  mountDev: string;
  protocol: string;
  pid: number;
}
export default Vue.extend({
  components: { tree, BaiduMap, BmMarker, BmMapType },
  data() {
    const label = {
      labelCols: "12",
      labelColsSm: "2",
      labelAlignSm: "right"
    };
    return {
      center: { lng: 0, lat: 0 },
      zoom: 15,
      label,
      devState: false,
      DevMac: ""
    };
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
      },
      pollInterval: 1000
    }
  },
  async asyncData({ route, query, app }) {
    // 获取apollo client句柄
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
    let children = Terminal.mountDevs.map(el =>
      Object.assign(el, { name: el.mountDev + el.pid })
    );
    /* Terminal.jw = (Terminal.jw as string)
      .split(",")
      .reverse()
      .join(","); */
    let Terminals = Object.assign(Terminal, { children });
    return { Terminals, DevMac };
  },

  methods: {
    handler({ BMap, map }: any) {
      const jw = ((this  as any).Terminals.jw) as string
      const [x,y] = jw.split(",").map(el=>el?parseFloat(el):0)
      console.log({x,y});
      
      const Point: BMap.Point = new BMap.Point(x, y);
      const convert: BMap.Convertor = new BMap.Convertor();
      convert.translate([Point], 1, 5, data => {
        this.$data.center = data.points[0];
      });
    },

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
  font-size: larger;
  padding-top: 2px;
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
