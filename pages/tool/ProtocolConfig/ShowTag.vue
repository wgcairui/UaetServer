<template>
  <div>
    <my-head title="协议显示标签配置"></my-head>
    <b-container>
      <b-row>
        <b-col>
          <separated title="add showtags"></separated>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import MyHead from "../../../components/MyHead.vue";
import separated from "../../../components/separated.vue";
export default Vue.extend({
  components: {
    MyHead,
    separated
  }
});
</script>

<style scoped></style>
