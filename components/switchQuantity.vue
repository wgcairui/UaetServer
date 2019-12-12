/* eslint-disable */
<template>
  <a class="  px-2   text-nowrap overflow-auto ">
    <span
      ><b-spinner
        small
        :variant="variantBg ? 'success' : 'danger'"
        type="grow"
      ></b-spinner
      >{{ title }}</span
    >
  </a>
</template>

<script>
export default {
  name: "SwitchQuantity",
  props: {
    title: {
      type: String,
      default: "SwitchQuantity"
    },
    variantBg: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped></style>
