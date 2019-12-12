/* eslint-disable */
<template>
  <div class=" border p-2 shadow-sm rounded-lg my-2">
    <h5 class="m-0">
      {{ language.get(keys) || keys
      }}<b-badge variant="info" pill class=" float-right"
        >{{ val }} {{ unit.get(keys) }}</b-badge
      >
    </h5>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "argumentBlocktwo",
  props: {
    keys: String,
    val: null
  },
  computed: {
    language() {
      return this.$store.getters.language(this.$i18n.locale);
    },
    ...mapGetters(["lang", "unit"])
  }
};
</script>

<style lang="scss" scoped></style>
