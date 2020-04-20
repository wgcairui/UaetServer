<template>
  <span>
    <b-spinner
      :variant="socketCont ? 'light' : 'dark'"
      v-b-tooltip.hover
      small
      type="grow"
      :title="
              socketCont ? 'WebSocket连接正常' : 'WebSocket连接断开'
            "
    ></b-spinner>
  </span>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  computed: {
    socketCont() {
      const state = this.$socket.connected
      return state;
    }
  }
});
</script>