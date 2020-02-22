<template>
  <div>
    <my-head title="透传终端运行状态" />
    <b-card>
      <b-table-lite responsive :items="Terminals" />
    </b-card>
  </div>
</template>

<script>
import gql from "graphql-tag"
import MyHead from "../../components/MyHead"
export default {
  components: {
    MyHead
  },
  data() {
    return {
      Terminals: []
    }
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
}
</script>
