/* eslint-disable */
<template>
  <b-row>
    <b-col
      ref="loginTitle"
      cols="12"
      class="loginTitle bg-info d-flex flex-row align-items-center"
    >
      <span @click="backto"><i class=" el-icon-back"></i></span>
      <span class=" text-light mx-2">|</span>
      <span class="text-center text-light">{{ title }}</span>
      <span class="ml-auto text-light"
        >{{ $t("Header.36axth") }}:{{ User }}</span
      >
    </b-col>
  </b-row>
</template>

<script>
export default {
  name: "Header",
  props: {
    title: {
      type: String,
      default: "Ladis"
    }
  },
  computed: {
    User() {
      return ""; // this.$store.state.user || "";
    }
  },
  methods: {
    backto() {
      this.$router.go(-1);
    }
  }
};
</script>

<style lang="scss" scoped>
.loginTitle {
  height: 60px;
}
</style>
