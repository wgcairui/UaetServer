<template>
  <b-container fluid class="p-0">
    <my-head title="注册" />
    <b-container>
      <b-row class="h-75">
        <b-col ref="loginBody" cols="12" class="d-flex flex-column h-auto w-50 p-4">
          <b-form>
            <b-form-group label="账号:" label-for="user" v-bind="label">
              <b-form-input id="user" v-model.trim="accont.user" :state="userStat" />
            </b-form-group>
            <b-form-group label="昵称：" label-for="name" v-bind="label">
              <b-form-input id="name" v-model.trim="accont.name" />
            </b-form-group>
            <b-form-group label="密码:" label-for="passwd" v-bind="label">
              <b-form-input
                id="passwd"
                v-model.trim="accont.passwd"
                type="password"
                :state="passwdStat"
              />
            </b-form-group>
            <b-form-group label="重复密码:" label-for="passwd2" v-bind="label">
              <b-form-input
                id="passwd2"
                v-model.trim="accont.passwd2"
                type="password"
                :state="passwd2Stat"
              />
            </b-form-group>
            <b-form-group label="电话:" label-for="tel" v-bind="label">
              <b-form-input type="tel" id="tel" v-model.trim="accont.tel" :state="telStat" />
            </b-form-group>
            <b-form-group label="邮箱:" label-for="mail" v-bind="label">
              <b-form-input type="mail" id="mail" v-model.trim="accont.mail"/>
            </b-form-group>
            <b-form-group label="组织:" label-for="company" v-bind="label">
              <b-form-input id="company" v-model.trim="accont.company" />
            </b-form-group>
            <b-form-group class="p-3">
              <b-button block variant="info" @click="register">注册</b-button>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </b-container>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  auth: false,
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      accont: {
        name: "",
        user: "",
        passwd: "",
        passwd2: "",
        tel: "",
        mail: "",
        company: ""
      },
      User: null
    };
  },
  computed: {
    userStat() {
      return (
        this.$data.accont.user !== "" &&
        this.$data.accont.user.length < 20 &&
        this.$data.User !== this.$data.accont.user
      );
    },
    passwdStat() {
      return (
        this.$data.accont.passwd !== "" && this.$data.accont.passwd.length < 20
      );
    },
    passwd2Stat() {
      return this.$data.accont.passwd === this.$data.accont.passwd2;
    },
    telStat() {
      const mailReg = /^1(3|4|5|7|8)\d{9}$/;
      return mailReg.test(this.$data.accont.tel);
    }
  },
  apollo: {
    User: {
      query: gql`
        query getUser($user: String) {
          User(user: $user) {
            user
          }
        }
      `,
      variables() {
        return { user: this.$data.accont.user };
      },
      update: data => (data.User ? data.User.user : null)
    }
  },
  methods: {
    register() {
      const { name, user, passwd, tel, mail, company } = this.$data.accont;
      if (
        !this.userStat ||
        !this.passwdStat ||
        !this.passwd2Stat
      ) {
        this.$bvModal.msgBoxOk("输入的参数格式错误");
      } else {
        this.$apollo
          .mutate({
            mutation: gql`
              mutation addUserAccont($arg: JSON) {
                addUser(arg: $arg) {
                  ok
                  msg
                }
              }
            `,
            variables: {
              arg: { name:name || user, user, passwd, tel, mail, company }
            }
          })
          .then(({ data }) => {
            if (data.addUser.ok && data.addUser.ok == 1) {
              this.$bvModal
                .msgBoxOk(data.addUser.msg)
                .then(stat => this.$router.push({ name: "login" }));
            } else this.$bvModal.msgBoxOk(data.addUser.msg);
          })
          .catch(e => {
            this.$bvModal.msgBoxOk("提交错误，请检查网络是否连接");
          });
      }
    }
  }
});
</script>
