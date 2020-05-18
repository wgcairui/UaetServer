<template>
  <div class="h-100 w-100">
    <!-- <my-head :title="title">
      <slot name="nav" />
    </my-head>-->
    <my-nav :title="title"></my-nav>
    <b-container class="mb-5">
      <slot />
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: {
    title: {
      default: "Title",
      type: String
    }
  }
});
</script>