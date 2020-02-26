<template>
  <div class="h-100 w-100">
    <b-container>
      <b-row>
        <b-col cols="12">
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
import Vue from "vue"
import gql from "graphql-tag"
import { tree } from "vued3tree"
import { Terminal } from "../../server/bin/interface"
interface selectTree {
  mountDev: string
  name: string
  children: any
}
export default Vue.extend({
  components: { tree },
  async asyncData({ route, query, app }) {
    let client = app.apolloProvider.defaultClient;
    let { data } = await client.query({
      query: gql`
        query getUserTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountNode
            mountDevs {
              name: mountDev
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables: {
        DevMac: query.DevMac
      }
    });
    let Terminal: Terminal = data.Terminal;
    let children = Terminal.mountDevs.map((el) =>
      Object.assign(el, { name: el.mountDev + el.pid })
    );
    let Terminals = Object.assign(Terminal, { children });
    return { Terminals };
  },
  data() {
    return {
      Terminal: null
    };
  },

  methods: {
    treeSelect({ data }: { data: selectTree }) {
      let { mountDev, name, children } = data;
      if (children) return;
      let query = { ...data, DevMac: this.$route.query.DevMac, type: "ut" }

      switch (mountDev) {
        case "温湿度":
          this.$router.push({
            name: "UT-th",
            query
          });
          break;
          case "ari-空调测试":
            this.$router.push({
              name:"UT-air",
              query
            })
            break
      }
    }
  }
})
</script>
<style>
.tree {
  min-height: 368px;
}
.treeclass .nodetree text {
  font-size: 18px !important;
  word-wrap: break-word;
}
</style>
