<template>
  <div>
    <b-row no-gutters>
      <b-card>
        <b-table-lite responsive :items="Terminals"></b-table-lite>
      </b-card>
    </b-row>
  </div>
</template>

<script>
import gql from "graphql-tag";
export default {
  data() {
    return {
      Terminals: []
    };
  },
  /* apollo: {
    Terminals: {
      query: gql`
        query TerminalsInfo(){
            
        }
        `
    }
  } */
};
</script>
