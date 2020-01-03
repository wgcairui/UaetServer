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
      Terminal: {
        name: "father",
        children: [
          {
            name: "son1xssssssssssssssss",
            value: 345
          },
          {
            name: "son2"
          },
          {
            name: "3"
          },
          {
            name: "3"
          },
          {
            name: "3"
          }
        ]
      },
    };
  },
  methods: {
    treeSelect(a) {
      console.log(a);
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
        let { mountDevs } = data.Terminal;
        let children = mountDevs.map((el) =>
          Object.assign(el, { name: el.mountDev })
        );
        console.log(Object.assign(data.Terminal, { children }));
        
        return Object.assign(data.Terminal, { children });
      }
    }
  }
};
</script>
<style scoped>
.tree {
  min-height: 368px;
}
</style>
