<template>
  <b-container>
    <b-row>
      <separated title="协议"></separated>
      <b-col v-for="(link, key) in Protocols" :key="key" cols="12" md="6">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
    <b-row>
      <separated title="节点信息"></separated>
      <b-col v-for="(link, key) in SysArgument" :key="key" cols="12" md="6">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
    <b-row>
      <separated title="透传终端"></separated>
      <b-col v-for="(link, key) in Terminal" :key="key" cols="12" md="6">
        <b-link :to="link.to" class="text-decoration-none">
          <b-card class="my-3">
            <b-card-body>
              <i class="iconfont ico">{{ link.ico }}</i>
              <span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
  </b-container>
</template>
<script lang="ts">
import Vue from "vue";
import separated from "../../components/separated.vue";
export default Vue.extend({
  components: { separated },
  data() {
    const Protocols = [
       { to: { name: "tool-Protocols" }, text: "所有协议", ico: "\uEC56" },
      { to: { name: "tool-addProtocol" }, text: "添加协议", ico: "\uEC56" }
     
    ];
    const SysArgument = [
      { to: { name: "tool-addNode" }, text: "添加节点", ico: "\uEBD8" },
      { to: { name: "tool-addDev" }, text: "添加设备类型", ico: "\uEBB8" }
    ];
    const Terminal = [
      {
        to: { name: "tool-RegisterTerminal" },
        text: "批量注册透传终端",
        ico: "\uEB63"
      },
      { to: { name: "tool-addTerminal" }, text: "注册终端信息", ico: "\uEB63" }
    ];
    return {
      Protocols,
      SysArgument,
      Terminal
    };
  }
});
</script>

<style scope>
.ico {
  font-size: 28px;
}
</style>
