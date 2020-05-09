<template>
  <my-page title="用户信息">
    <template v-slot:nav>
      <my-nav />
    </template>
    <b-row>
      <separated title="详情">
        <b-button variant="link" class="text-decoration-none">
          <i class="iconfont">&#xeb71;</i>修改信息
        </b-button>
      </separated>
      <b-col>
        <b-table-lite stacked :items="user" :fields="userField" />
      </b-col>
    </b-row>
    <b-row>
      <separated title="告警配置" />
      <b-col>
        <b-form>
          <my-form label="告警短信号码:">
            <b-form-tags placeholder="输入号码回车" v-model="userSetup.tels"></b-form-tags>
          </my-form>
          <my-form label="告警邮件邮箱:">
            <b-form-tags placeholder="输入邮箱回车" v-model="userSetup.mails"></b-form-tags>
          </my-form>
          <b-button class="float-right" variant="info" @click="saveAlarmConnect">保存</b-button>
        </b-form>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      userSetup: { tels: [], mails: [] },
      user: [],
      userField: [
        { key: "name", label: "用户名:" },
        { key: "user", label: "账号:" },
        { key: "userGroup", label: "用户组:" },
        { key: "mail", label: "邮箱:" },
        { key: "company", label: "组织:" },
        { key: "tel", label: "联系电话:" }
      ] as BvTableFieldArray
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
      update: data => (data.User ? [data.User] : [])
    },
    userSetup: {
      query: gql`
      query{
        userSetup:getUserSetup{
          tels
          mails
        }
      }
      `
    }
  },
  methods: {
    async saveAlarmConnect() {
      const tels = this.$data.userSetup.tels as string[];
      const mails = this.$data.userSetup.mails as string[];
      const regtel = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/;
      const regmail = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
      for (let tel of tels) {
        if (!regtel.test(tel)) {
          this.$bvModal.msgBoxOk("手机号码需要为11位的大陆号码", {
            title: "输入错误",
            buttonSize: "sm"
          });
          return;
        }
      }
      for (let mail of mails) {
        if (!regmail.test(mail)) {
          this.$bvModal.msgBoxOk("邮箱格式错误", {
            title: "输入错误",
            buttonSize: "sm"
          });
          return;
        }
      }
      //
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation setUserSetupContact($tels: [String], $mails: [String]) {
            setUserSetupContact(tels: $tels, mails: $mails) {
              ok
            }
          }
        `,
        variables: {
          tels: Array.from(new Set(tels)),
          mails: Array.from(new Set(mails))
        }
      });
      this.$bvToast.toast("添加告警联系方式成功!!");
    }
  }
});
</script>
