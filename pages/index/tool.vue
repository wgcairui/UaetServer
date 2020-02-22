<template>
  <b-container>
    <b-row>
      <b-col v-for="(link, key) in navItem" :key="key" cols="12" md="6">
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
import Vue from "vue"
export default Vue.extend({
  data() {
    return {
      navItem: [
        { to: { name: "tool-addTerminal" }, text: "添加终端", ico: "\uEB63" },
        {
          to: { name: "tool-addTerminals" },
          text: "批量添加终端",
          ico: "\uEB63"
        },
        { to: { name: "tool-addDev" }, text: "添加设备类型", ico: "\uEBB8" },
        { to: { name: "tool-addNode" }, text: "添加节点", ico: "\uEBD8" },
        { to: { name: "tool-addProtocol" }, text: "添加协议", ico: "\uEC56" }
      ]
    }
  }
})
</script>

<style scope>
.ico {
  font-size: 28px;
}
</style>
