<template>
  <b-container fluid>
    <my-head :title="this.$route.name">
      <b-nav>
        <b-nav-item v-for="(i, key) in navItem" :key="key" v-bind="i">{{
          i.text
        }}</b-nav-item>
      </b-nav>
    </my-head>
    <nuxt  class=" py-4" />
  </b-container>
</template>
<script>
import MyHead from "~/components/MyHead.vue";
export default {
  components: {
    MyHead
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
