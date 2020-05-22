<template>
  <b-row no-gutters>
    <b-col
      ref="loginTitle"
      cols="12"
      class="loginTitle bg-info d-flex flex-row align-items-center px-2"
    >
      <!-- <span>
        <b-button variant="link" class="m-0 p-0 text-decoration-none" @click="backto">
          <i class="iconfont text-light">&#xe641;</i>
        </b-button>
      </span>
      <span class="text-light mx-2">|</span> -->
      <span class="text-center text-light">{{ title }}</span>
      <div class="ml-auto d-flex">
        <slot>
          <socket-state></socket-state>
          <span v-if="User" class="ml-auto text-light">
            <i class="iconfont">&#xeb6f;</i>
            {{ User }}
          </span>
        </slot>
      </div>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from "vue";
import { WebInfo } from "../store/DB";
export default Vue.extend({
  name: "MyHead",
  props: {
    title: {
      type: String,
      default: "Ladis"
    }
  },
  computed: {
    User() {
      const user = this.$auth.user;
      return user;
    }
  },
  /* methods: {
    backto() {
      this.$router.go(-1);
    }
  } */
});
</script>

<style scoped>
.loginTitle {
  height: 57px;
}
.navbar-dark,
.navbar-nav,
.nav-link,
.dropdown-toggle span {
  color: aliceblue !important;
}
</style>
