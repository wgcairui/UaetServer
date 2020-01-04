<template>
  <div class=" h-100 w-100">
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
            >
            </tree>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import gql from "graphql-tag";
import { tree } from "vued3tree";
export default {
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
          break;
      }
    }
  },
  apollo: {
    Terminal: {
      query: gql`
        query getUserTerminal($DevMac: String) {
          Terminal(DevMac: $DevMac) {
            DevMac
            name
            mountNode
            mountDevs {
              mountDev
              protocol
              pid
            }
          }
        }
      `,
      variables() {
        return { DevMac: this.$route.query.DevMac };
      },
      update: (data) => {
        if (!data.Terminal) return { name: "null Node" };
        const children = data.Terminal.mountDevs.map((el) => ({
          name: el.mountDev + el.pid,
          mountDev: el.mountDev
        }));
        data.Terminal = Object.assign(data.Terminal, { children });
        return data.Terminal;
      },
      skip() {
        return false;
      }
    }
  }
};
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
