<template>
  <b-container fluid class="p-0">
    <my-head title="注册"></my-head>
    <b-container>
      <b-row class="h-75">
        <b-col cols="12" ref="loginBody" class="d-flex flex-column h-auto w-50 p-4">
          <b-form>
            <b-form-group label="账号:" label-for="user" v-bind="label">
              <b-form-input id="user" v-model.trim="accont.user" :state="userStat"></b-form-input>
            </b-form-group>
            <b-form-group label="昵称：" label-for="name" v-bind="label">
              <b-form-input id="name" v-model.trim="accont.name"></b-form-input>
            </b-form-group>
            <b-form-group label="密码:" label-for="passwd" v-bind="label">
              <b-form-input
                id="passwd"
                type="password"
                v-model.trim="accont.passwd"
                :state="passwdStat"
              ></b-form-input>
            </b-form-group>
            <b-form-group label="重复密码:" label-for="passwd2" v-bind="label">
              <b-form-input
                id="passwd2"
                type="password"
                v-model.trim="accont.passwd2"
                :state="passwd2Stat"
              ></b-form-input>
            </b-form-group>
            <b-form-group label="邮箱:" label-for="mail" v-bind="label">
              <b-form-input id="mail" v-model.trim="accont.mail" :state="mailStat"></b-form-input>
            </b-form-group>
            <b-form-group label="组织:" label-for="company" v-bind="label">
              <b-form-input id="company" v-model.trim="accont.company"></b-form-input>
            </b-form-group>
            <b-form-group class="p-3">
              <b-button @click="register" block variant="info">注册</b-button>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
  </b-container>
</template>
<script lang="ts">
import Vue from "vue";
import MyHead from "../../components/MyHead.vue";
import gql from "graphql-tag";
export default Vue.extend({
  auth: false,
  components: {
    MyHead
  },
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      accont: {
        name: "admin",
        user: "admin",
        passwd: "123456",
        passwd2: "123456",
        mail: "260338538@qq.com",
        company: "ladis"
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
    mailStat() {
      let mailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
      return mailReg.test(this.$data.accont.mail);
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
      update: (data) => (data.User ? data.User.user : null)
    }
  },
  methods: {
    register() {
      let { name, user, passwd, mail, company } = this.$data.accont;
      if (
        !this.$data.userStat ||
        !this.$data.passwdStat ||
        !this.$data.passwd2Stat ||
        !this.$data.mailStat
      )
        this.$bvModal.msgBoxOk("输入的参数格式错误");
      else
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
              arg: { name, user, passwd, mail, company }
            }
          })
          .then(({ data }) => {
            if (data.addUser.ok && data.addUser.ok == 1) {
              this.$bvModal
                .msgBoxOk(data.addUser.msg)
                .then((stat) => this.$router.push({ name: "login" }));
            } else this.$bvModal.msgBoxOk(data.addUser.msg);
          })
          .catch((e) => {
            this.$bvModal.msgBoxOk("提交错误，请检查网络是否连接");
          });
    }
  }
});
</script>
