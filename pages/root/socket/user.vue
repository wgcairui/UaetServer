<template>
  <b-col>
    <separated title="终端">
      <b-input v-model="filter" placeholder="输入设备ID搜索数据" size="sm"></b-input>
    </separated>
    <b-table :items="user" :fields="fields">
      <template v-slot:cell(user)="row">
        <b-link :to="{name:'admin-node-user',query:{user:row.value}}">{{row.value}}</b-link>
      </template>
      <template v-slot:cell(oprate)="row">
        <b-button-group size="sm">
          <b-button :to="{name:'root-log-userlogins',query:{user:row.item.user}}">日志</b-button>
        </b-button-group>
      </template>
    </b-table>
  </b-col>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      filter: this.$route.query.DevMac || "",
      user: [],
      fields: [
        { key: "user", label: "用户" },
        { key: "set", label: "在线数" },
        { key: 'oprate', label: '操作' }
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