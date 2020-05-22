<template>
  <b-container fluid class="d-flex flex-column h-100 p-0">
    <b-row name="header" no-gutters>
      <b-col>
        <header class="d-flex flex-row p-2 shadow-sm">
          <b-img src="https://www.ladishb.com/logo.png"></b-img>
          <b-button variant="link" class="ml-auto text-success">English</b-button>
        </header>
      </b-col>
    </b-row>
    <b-row class="flex-grow-1 login-body" no-gutters>
      <b-col class cols="0" md="6"></b-col>
      <b-col
        ref="loginBody"
        cols="12"
        md="6"
        class="d-flex align-items-center justify-content-center"
      >
        <b-card class="shadow login p-3">
          <b-card-body class="d-flex flex-column h-100">
            <div class="d-flex flex-row mb-3">
              <h4 class="text-success login-left">登陆</h4>
              <div class="ml-auto">
                <b-link class="m-1 text-info" :to="{ name: 'user-register' }">{{$t('zhu-ce')}}</b-link>
                <b-link class="m-1 ml-2 text-info" :to="{ name: 'user-reset' }">{{$t('zhong-zhi')}}</b-link>
              </div>
            </div>
            <b-form class="mx-3 mt-auto">
              <b-form-group label="账号:" label-for="user" v-bind="label">
                <b-form-input id="user" v-model.trim="accont.user" placeholder />
              </b-form-group>
              <b-form-group label="密码:" label-for="passwd" v-bind="label">
                <b-form-input
                  id="passwd"
                  v-model.trim="accont.passwd"
                  type="password"
                  placeholder
                  @keyup.enter="login_submit"
                />
              </b-form-group>
              <b-button id="login_submit" block variant="info" class="mt-4" @click="login_submit">
                {{$t('deng-lu')}}
                <span />
              </b-button>
            </b-form>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import vue from "vue";
import { AES } from "crypto-js";
export default vue.extend({
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      accont: {
        user: "",
        passwd: ""
      }
    };
  },
  methods: {
    async login_submit() {
      const { user, passwd } = this.$data.accont;
      // 向服务器请求加密hash
      const data = await this.$axios
        .$get("/api/auth/hash", { params: { user } })
        .then(el => el)
        .catch(error => {
          this.$bvModal.msgBoxOk(error?.response?.data || "流程出错", {
            size: "sm",
            buttonSize: "sm"
          });
        });
      //
      if (!data?.hash || !passwd) return;
      this.$auth
        .loginWith("local", {
          data: { user, passwd: AES.encrypt(passwd, data.hash).toString() }
        })
        .then((data: any) => {
          localStorage.setItem("uartserverUser", data.data.user);
          switch (data.data.userGroup) {
            case "admin":
              this.$router.push({ name: "manage" });
              break;
            case "root":
              this.$router.push({ name: "admin" });
              break;
            default:
              this.$router.push("/");
              break;
          }
        })
        .catch(error => {
          //console.log({ error, keys: Object.keys(error) });
          if (!error.response || error.response.status !== 400) {
            this.$bvModal.msgBoxOk("登录遇到未知错误");
            return;
          } else {
            // console.log(error.response);
            switch (error.response.data) {
              case "userNan":
                this.$bvModal.msgBoxOk("用户名错误");
                break;
              case "passwdError":
                this.accont.passwd = "";
                this.$bvModal.msgBoxOk("用户密码错误");
                break;
            }
          }
        });
      /* try {
        const result = await this.$auth.loginWith("local", {
          data: { user, passwd: AES.encrypt(passwd, hash).toString() }
        });
        // console.log({ result });
        localStorage.setItem("uartserverUser", user);
      } catch (error) {
        // console.log({ error, keys: Object.keys(error) });
        if (!error.response || error.response.status !== 400) {
          this.$bvModal.msgBoxOk("登录遇到未知错误");
          return;
        } else {
          // console.log(error.response);
          switch (error.response.data) {
            case "userNan":
              this.$bvModal.msgBoxOk("用户名错误");
              break;
            case "passwdError":
              this.accont.passwd = "";
              this.$bvModal.msgBoxOk("用户密码错误");
              break;
          }
        }
      } */
    }
  },
  mounted() {
    const user = localStorage.getItem("uartserverUser");
    if (user) this.accont.user = user;
  }
});
</script>
<style scoped>
@media screen and (min-width: 568px) {
  .login {
    max-width: 90%;
    margin: auto;
    min-width: 500px;
    height: 368px;
  }
  .login-body {
    background-color: #f5f5f6;
    background-image: url("https://img.alicdn.com/tfs/TB14xWackxz61VjSZFrXXXeLFXa-2400-1120.jpg");
    /* background-image: url(https://www.ladishb.com/banner/banner04-pc.jpg); */
    background-size:contain;
    /* background-blend-mode:luminosity */
  }
}
</style>
