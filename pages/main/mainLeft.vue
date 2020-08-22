<template>
  <b-col cols="0" xl="3">
      <b-list-group>
          <b-list-group-item v-for="val in data" :key="val._id">{{val.mac+val.msg}}</b-list-group-item>
      </b-list-group>
  </b-col>
</template>
<script lang="ts">
import Vue from 'vue'
import gql from "graphql-tag"
export default Vue.extend({
  data() {
    return {
      start: new Date().toLocaleDateString().replace(/\//g, "-") + " 0:00:00",
      end: new Date().toLocaleDateString().replace(/\//g, "-") + " 23:59:59",
      filter: this.$route.params.msg || "",
      data: [],
    }
  },
  apollo: {
    data: {
      query: gql`
        query loguartterminaldatatransfinites($start: Date, $end: Date) {
          data: loguartterminaldatatransfinites(start: $start, end: $end)
        }
      `,
      variables() {
        return { start: this.$data.start, end: this.$data.end };
      },
      pollInterval:60000
    }
  },
})
</script>