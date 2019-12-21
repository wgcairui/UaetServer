<template>
  <b-container fluid>
    <headers :title="this.$route.name">
      <b-nav>
        <b-nav-item v-for="(i, key) in navItem" :key="key" v-bind="i">{{
          i.text
        }}</b-nav-item>
      </b-nav>
    </headers>
    <nuxt  class=" py-4" />
  </b-container>
</template>
<script>
import Headers from "~/components/Header.vue";
export default {
  components: {
    Headers
  },
  data() {
    return {
      navItem: [
        { to: { name: "tool-index-addTerminal" }, text: "添加终端" },
        { to: { name: "tool-index-addDev" }, text: "添加设备类型" },
        { to: { name: "tool-index-addNode" }, text: "添加节点" },
        { to: { name: "tool-index-addProtocol" }, text: "添加协议" }
      ]
    };
  },
  mounted() {
    console.log(this.$route.name);
  }
};
</script>
<style scoped>
.nav-link {
  color: aliceblue;
}
</style>
