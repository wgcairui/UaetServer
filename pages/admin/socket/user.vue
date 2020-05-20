<template>
  <my-page-manage title="用户Tcp">
    <b-row>
      <b-col>
        <b-table :items="user" :fields="fields">
          <template v-slot:cell(user)="row">
            <b-link :to="{name:'admin-node-user',query:{user:row.value}}">{{row.value}}</b-link>
          </template>
        </b-table>
      </b-col>
    </b-row>
  </my-page-manage>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      user: [],
      fields: [
        { key: "user", label: "用户" },
        { key: "set", label: "在线数" }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    user: {
      query: gql`
        {
          user: getUserNode
        }
      `,
      pollInterval: 1000
    }
  }
});
</script>