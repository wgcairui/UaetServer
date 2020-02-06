<template>
  <div class="h-100 w-100">
    <b-container>
      <b-row>
        <b-col cols="12">
          <b-card>
            <tree
              :data="Terminal"
              node-text="name"
              layoutType="horizontal"
              class="tree"
              :radius="6"
              @clickedNode="treeSelect"
              @clickedText="treeSelect"
            ></tree>
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
export default Vue.extend({
  components: { tree },
  data() {
    return {
      Terminal: null
    };
  },

  methods: {
    treeSelect({ data }) {
      let { mountDev, name, children } = data;
      if (children) return;
      console.log(mountDev);

      switch (mountDev) {
        case "温湿度":
          this.$router.push({
            name: "Dev-th",
            query: { ...data, DevMac: this.$route.query.DevMac, type: "ut" }
          });
          break;
      }
    }
  },
  async asyncData({ route, query, app }) {
    let client = app.apolloProvider.defaultClient;
    let { data } = await client.query({
      query: gql`
        query getUserTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountNode
            children: mountDevs {
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
    let Terminal = data.Terminal;
    Terminal.children = Terminal.children.map((el) =>
      Object.assign(el, { name: el.mountDev + el.pid })
    );
    return { Terminal };
  }
});
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
