<template>
  <b-form-group :label="label" :description="description" v-bind="forGroup">
    <slot></slot>
  </b-form-group>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  props: ["label", 'description'],
  data() {
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" }
    };
  }
});
</script>