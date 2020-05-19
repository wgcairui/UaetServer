<template>
  <my-page-user title="用户状态" :isUser="false">
    <b-row class="my-5">
      <b-col>
        <b-table :items="Users" :fields="NodeInfoFields" responsive>
          <template v-slot:cell(creatTime)="row">{{ new Date(row.value).toLocaleDateString()}}</template>
          <template
            v-slot:cell(modifyTime)="row"
          >{{ row.value?new Date(row.value).toLocaleDateString() :''}}</template>
        </b-table>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      Users: [],
      NodeInfoFields: [
        { key: "user", label: "账号" },
        { key: "name", label: "昵称" },
        { key: "userGroup", label: "用户组" },
        { key: "mail", label: "邮箱" },
        { key: "tel", label: "电话" },
        { key: "creatTime", label: "创建时间" },
        { key: "modifyTime", label: "修改时间" },
        { key: "address", label: "登陆IP" },
        { key: "status", label: "启用状态" }
      ] as BvTableFieldArray
    };
  },
  apollo: {
    Users: gql`
      {
        Users {
          name
          user
          userGroup
          mail
          company
          tel
          creatTime
          modifyTime
          address
          status
          messageId
        }
      }
    `
  }
});
</script>
