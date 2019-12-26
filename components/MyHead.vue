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
          @click="backto"
          class="m-0 p-0 text-decoration-none"
          ><i class="iconfont text-light">&#xe641;</i></b-button
        ></span
      >
      <span class=" text-light mx-2">|</span>
      <span class="text-center text-light">{{ title }}</span>
      <slot></slot>
      <span class="ml-auto text-light" v-if="User"
        ><i class="iconfont">&#xeb6f;</i>{{ User }}</span
      >
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
