/* eslint-disable */
<template>
  <b-row no-gutters>
    <b-col
      ref="loginTitle"
      cols="12"
      class="loginTitle bg-info d-flex flex-row align-items-center px-2"
    >
      <span
        ><b-button
          variant="link"
          class="m-0 p-0 text-decoration-none"
          @click="backto"
          ><i class="iconfont text-light">&#xe641;</i></b-button
        ></span
      >
      <span class=" text-light mx-2">|</span>
      <span class="text-center text-light">{{ title }}</span>
      <slot />
      <div class="ml-auto ">
        <span>
          <b-spinner
            :variant="$socket.connected ? 'light' : 'dark'"
            v-b-tooltip.hover
            small
            type="grow"
            :title="
              $socket.connected ? 'WebSocket连接正常' : 'WebSocket连接断开'
            "
          ></b-spinner
        ></span>
        <span v-if="User" class="ml-auto text-light"
          ><i class="iconfont">&#xeb6f;</i>{{ User }}</span
        >
      </div>
    </b-col>
  </b-row>
</template>

<script>
export default {
  name: "MyHead",
  props: {
    title: {
      type: String,
      default: "Ladis"
    }
  },
  computed: {
    User() {
      return this.$auth.user; // this.$store.state.user || "";
    }
  },
  methods: {
    backto() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
.loginTitle {
  height: 57px;
}
</style>
