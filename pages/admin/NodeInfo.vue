<template>
  <div>
    <b-table-lite></b-table-lite>
  </div>
</template>
<script>
import gql from "graphql-tag";
export default {
  data() {
    return {
      NodeInfo: []
    };
  },
  apollo: {
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
    `
  }
};
</script>
