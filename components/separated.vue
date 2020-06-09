<template>
  <b-col cols="12" class="border-bottom my-2 px-3 d-md-flex justify-content-center flex-row">
    <div class=" my-1">
      <span v-show="back" @click="backto">
        <i class="el-icon-back" />
        <span class="text-dark mx-2">|</span>
      </span>
      <b>{{ title }}</b>
    </div>
    <div class="ml-auto my-1">
      <slot />
    </div>
  </b-col>
</template>

<script>
export default {
  name: "Separated",
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
