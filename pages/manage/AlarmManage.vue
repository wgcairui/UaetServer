<template>
  <my-page title="告警管理">
    <b-row>
      <b-col>
        <b-table :items="infos"></b-table>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue"
export default Vue.extend({
  computed:{
    infos(){
      const infos = this.$store.state.Infos
      return infos || []
    }
  }
})
</script>
