<template>
  <my-page title="重置密码">
    <b-row>
      <b-col>
        <b-card sub-title="输入邮箱或账号" class="my-5 p-5">
          <b-form>
            <my-form label="邮箱|账号:">
              <b-input-group>
                <b-form-input v-model="user"></b-form-input>
                <b-input-group-append>
                  <b-button @click="resetUserPasswd(user)">确定</b-button>
                </b-input-group-append>
              </b-input-group>
            </my-form>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
  </my-page>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { ApolloMongoResult } from "../../server/bin/interface";

import { MessageBox } from "element-ui";
import "element-ui/lib/theme-chalk/message-box.css";
export default Vue.extend({
  auth: false,
  data() {
    return {
      user: ""
    };
  },
  methods: {
    async resetUserPasswd(user: string) {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation resetUserPasswd($user: String) {
            resetUserPasswd(user: $user) {
              ok
              msg
            }
          }
        `,
        variables: { user }
      });
      const validation = result.data.resetUserPasswd as ApolloMongoResult;
      if (!validation.ok) {
        MessageBox.alert(validation.msg);
        return;
      }
      const code = await MessageBox.prompt(
        `已发送验证码到${validation.msg},请输入验证码确认`
      ).catch(e => console.log(""));
      if (!code) return;
      const value = (code as any).value;
      //
      const resetValidationCode = await this.$apollo.mutate({
        mutation: gql`
          mutation resetValidationCode($user: String, $code: String) {
            resetValidationCode(user: $user, code: $code) {
              ok
              msg
            }
          }
        `,
        variables: { user, code: value }
      });
      const hashs = resetValidationCode.data
        .resetValidationCode as ApolloMongoResult;
      if (!hashs.ok) {
        MessageBox.alert(hashs.msg);
        return;
      }
      //
      const passwd = await MessageBox.prompt("输入新的密码:")
        .then(el => (el as any).value)
        .catch(e => false);
      if(!passwd) return
      //
      const reset = await this.$apollo.mutate({
        mutation:gql`
        mutation setUserPasswd($hash:String,$passwd:String){
          setUserPasswd(hash:$hash,passwd:$passwd){
            ok
            msg
          }
        }
        `,
        variables:{hash:hashs.msg,passwd}
      })
      const setUserPasswd = reset.data.setUserPasswd as ApolloMongoResult
      if(!setUserPasswd.ok){
        MessageBox.alert(setUserPasswd.msg)
        return
      }
      //
      this.$auth.logout()
      this.$router.push("/")
    }
  }
});
</script>
