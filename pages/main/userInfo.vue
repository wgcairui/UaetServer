<template>
  <b-row>
    <b-col>
      <b-row>
        <separated title="详情">
          <b-button variant="link" class="text-decoration-none">
            <i class="iconfont">&#xeb71;</i>修改信息
          </b-button>
        </separated>
        <b-col>
          <!-- <b-table-lite stacked :items="user" :fields="userField" /> -->
          <div v-for="i in userField" :key="i.key">
            <my-form :label="i.label">
              <b-form-text @click="modifyUserInfo(i,user[i.key])">
                <strong style="font-size:16px">{{user[i.key]}}</strong>
              </b-form-text>
            </my-form>
            <span></span>
          </div>
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
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { BvTableFieldArray } from "bootstrap-vue";
import { UserInfo, ApolloMongoResult } from "uart";
import { MessageBox } from "element-ui";
import "element-ui/lib/theme-chalk/message-box.css";
export default Vue.extend({
  data() {
    return {
      userSetup: { tels: [], mails: [] },
      user: {} as UserInfo,
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
          user: User(user: $user) {
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
      }
    },
    userSetup: {
      query: gql`
        query {
          userSetup: getUserSetup {
            tels
            mails
          }
        }
      `
    }
  },
  methods: {
    async modifyUserInfo(item: { key: string; label: string }, val: any) {
      if (item.key === "user" || item.key === "userGroup") return;
      const value = await MessageBox.prompt(`请输入新的${item.label}`, { inputValue: val })
        .catch(e => {
          console.log("取消输入");
          return false
        });
      if (!value) return
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation modifyUserInfo($arg: JSON) {
            modifyUserInfo(arg: $arg) {
              ok
              msg
            }
          }
        `,
        variables: { arg: { [item.key]: (value as any).value } }
      });
      //
      const modify = result.data.modifyUserInfo as ApolloMongoResult;
      if (!modify.ok) MessageBox.alert(modify.msg);
      else this.$apollo.queries.user.refetch();
    },
    async saveAlarmConnect() {
      const tels = this.$data.userSetup.tels as string[];
      const mails = this.$data.userSetup.mails as string[];
      const regtel = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/;
      const regmail = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
      for (let tel of tels) {
        if (!regtel.test(tel)) {
          this.$bvModal.msgBoxOk("手机号码需要为11位的大陆号码", { title: "输入错误", buttonSize: "sm" });
          return;
        }
      }
      for (let mail of mails) {
        if (!regmail.test(mail)) {
          this.$bvModal.msgBoxOk("邮箱格式错误", { title: "输入错误", buttonSize: "sm" });
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
        variables: { tels: Array.from(new Set(tels)), mails: Array.from(new Set(mails)) }
      });
      this.$bvToast.toast("添加告警联系方式成功!!");
    }
  }
});
</script>
<style lang="scss" scoped>
.bv-no-focus-ring {
  padding: 7px;
}
.text-muted {
  color: black !important;
  padding: 5px;
  margin: 0;
}
</style>
