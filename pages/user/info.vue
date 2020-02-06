<template>
  <div class="w-100">
    <my-head title="用户信息"></my-head>
    <b-container>
      <b-row>
        <separated title="详情">
          <b-button variant="link" class="text-decoration-none">
            <i class="iconfont">&#xeb71;</i>修改信息
          </b-button>
        </separated>
        <b-table-lite stacked :items="user" :fields="userField"></b-table-lite>
      </b-row>
      <b-row>
        <separated title="告警配置"></separated>
      </b-row>
    </b-container>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import MyHead from "../../components/MyHead.vue";
import separated from "../../components/separated.vue";
import gql from "graphql-tag";
export default Vue.extend({
  components: {
    MyHead,
    separated
  },
  data() {
    return {
      user: [],
      userField: [
        { key: "name", label: "用户名:" },
        { key: "user", label: "账号:" },
        { key: "userGroup", label: "用户组:" },
        { key: "mail", label: "邮箱:" },
        { key: "company", label: "组织:" },
        { key: "tel", label: "联系电话:" }
      ]
    };
  },
  apollo: {
    user: {
      query: gql`
        query getMyUserInfo($user: String) {
          User(user: $user) {
            name
            user
            userGroup
            mail
            company
            tel
          }
        }
      `,
      variables() {
        return { user: this.$auth.user };
      },
      update: (data) => [data.User]
    }
  },
  mounted() {
    console.log(this.$auth.user);
  }
});
</script>
