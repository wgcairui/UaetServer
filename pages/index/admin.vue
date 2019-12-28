<template>
  <b-container>
    <b-row>
      <b-col cols="12" md="6" v-for="(link, key) in navItem" :key="key">
        <b-link :to="link.to" class=" text-decoration-none ">
          <b-card class=" my-3">
            <b-card-body>
              <i class="iconfont ico">{{link.ico}}</i
              ><span class="text-dark">{{ link.text }}</span>
            </b-card-body>
          </b-card>
        </b-link>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  data() {
    return {
      navItem: [
        { to: { name: "admin-NodeInfo" }, text: "节点状态", ico: "\uebd8" },
        { to: { name: "admin-TerminalInfo" }, text: "终端状态", ico: "\ueb63" }
      ]
    };
  }
};
</script>
<style scope>
.ico {
  font-size: 28px;
}
</style>
