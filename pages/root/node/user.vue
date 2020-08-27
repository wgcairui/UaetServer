<template>
  <b-col>
    <separated title="用户状态">
      <b-input v-model="filter" placeholder="输入账号搜索数据" size="sm"></b-input>
    </separated>
    <b-table
      :items="Users"
      :filter="new RegExp(filter)"
      :fields="NodeInfoFields"
      responsive
      striped
      hover
      show-empty
    >
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
import { UserInfo } from "uart";
export default Vue.extend({
  data() {
    return {
      filter: this.$route.query.user || "",
      Users: [],
      NodeInfoFields: [
        { key: "user", label: "账号" },
        { key: "name", label: "昵称" },
        { key: "userGroup", label: "用户组" },
        { key: "mail", label: "邮箱" },
        { key: "tel", label: "电话" },
        { key: "creatTime", label: "创建时间", formatter: date => new Date(date).toLocaleString() },
        { key: "modifyTime", label: "修改时间", formatter: date => new Date(date).toLocaleString() },
        { key: "address", label: "登陆IP" },
        { key: 'oprate', label: '操作' }
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
