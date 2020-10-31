<template>
  <b-col>
    <separated title="用户状态">
      <b-input v-model="filter" placeholder="输入账号搜索数据" size="sm"></b-input>
    </separated>
    <b-table
      :items="BindDevices"
      :filter="new RegExp(filter)"
      :fields="NodeInfoFields"
      responsive
      striped
      hover
      show-empty
    >
      <template v-slot:cell(UTs)="row">
        <b-link
          v-for="(val,key) in row.value"
          :key="key"
          class="mr-1"
          :to="{name:'root-node-Terminal',query:{DevMac:val}}"
        >
          <b-badge>{{val}}</b-badge>
        </b-link>
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
        filter: this.$route.query.user || "",
        BindDevices: [],
        NodeInfoFields: [
          { key: "user", label: "账号" },
          { key: 'UTs', label: 'DTU' }
        ] as BvTableFieldArray
      };
    },
    apollo: {
      BindDevices: gql`
      {
        BindDevices 
      }
    `
    }
  });
</script>
