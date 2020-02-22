
<template>
  <span>
    <b class="mx-1">{{ lang.get(keys) || keys }}:</b>
    <i class=" text-success">{{ value }}</i>
    <b class="mx-1">{{ unit.get(keys) }}</b>
  </span>
</template>

<script>
import { mapGetters } from "vuex"
export default {
  name: "ArgumentBlock",
  props: {
    val: null,
    keys: String
  },
  computed: {
    ...mapGetters(["lang", "unit"]),
    value() {
      const val = this.val
      if (typeof val === "boolean") {
        return val ? "正常" : "异常"
      } else {
        return val
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
