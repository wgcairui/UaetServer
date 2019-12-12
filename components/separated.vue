/* eslint-disable */
<template>
  <b-col cols="12" class=" border-bottom m-2 p-1"
    ><span @click="backto" v-show="back"
      ><i class=" el-icon-back"></i><span class=" text-dark mx-2">|</span></span
    ><b>{{ title }}</b>
  </b-col>
</template>

<script>
export default {
  name: "separated",
  props: {
    title: {
      type: String,
      default: "title"
    },
    back: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    backto() {
      this.$router.back();
    }
  }
};
</script>

<style lang="scss" scoped></style>
