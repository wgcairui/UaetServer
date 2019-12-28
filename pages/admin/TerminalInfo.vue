<template>
  <div>
    <my-head title="透传终端运行状态"></my-head>
    <b-card>
      <b-table-lite responsive :items="Terminals"></b-table-lite>
    </b-card>
  </div>
</template>

<script>
import MyHead from "../../components/MyHead";
import gql from "graphql-tag";
export default {
  components: {
    MyHead
  },
  data() {
    return {
      Terminals: []
    };
  },
  apollo: {
    Terminals: {
      query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
            mountNode
          }
        }
      `
    }
  }
};
</script>
