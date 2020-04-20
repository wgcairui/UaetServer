<template>
  <div class="h-100 w-100">
    <my-head :title="'挂载设备:' + DevMac" />
    <b-container>
      <b-row>
        <b-col>
          <separated title="透传终端信息"></separated>
          <b-jumbotron>
            <b-form>
              <b-form-group label="模块ID:" v-bind="label">
                <b-form-text class="terminal text-dark">{{
                  DevMac
                }}</b-form-text>
              </b-form-group>
              <b-form-group label="模块IP:" v-bind="label">
                <b-form-text class="terminal text-dark">{{
                  Terminals.ip
                }}</b-form-text>
              </b-form-group>
              <b-form-group label="模块端口:" v-bind="label">
                <b-form-text class="terminal text-dark">{{
                  Terminals.port
                }}</b-form-text>
              </b-form-group>
              <b-form-group label="模块地理地址:" v-bind="label">
                <b-form-text class="terminal text-dark">
                  <b-link
                    href="http://www.gpsspg.com/maps.htm"
                    target="_blank"
                    >{{ Terminals.jw }}</b-link
                  >
                </b-form-text>
              </b-form-group>
              <b-form-group label="上次在线时间:" v-bind="label">
                <b-form-text class="terminal text-dark">{{
                  Terminals.uptime
                }}</b-form-text>
              </b-form-group>
            </b-form>
          </b-jumbotron>
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
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { tree } from "vued3tree";
import { Terminal } from "../../server/bin/interface";
interface selectTree {
  Type: string;
  mountDev: string;
  protocol: string;
  pid: number;
}
export default Vue.extend({
  components: { tree},
  data() {
    const label = {
      labelCols: "12",
      labelColsSm: "2",
      labelAlignSm: "right"
    };
    return {
      label
    };
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
    Terminal.jw = (Terminal.jw as string).split(',').reverse().join(',')
    let Terminals = Object.assign(Terminal, { children });
    return { Terminals, DevMac };

  },

  methods: {
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
</style>
