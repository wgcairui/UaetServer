<template>
  <b-container fluid class="d-flex flex-column h-100 p-0">
    <b-row name="header" no-gutters>
      <b-col>
        <header class="d-flex flex-row p-2 shadow-sm" style="height:56px">
          <b-img
            src="https://www.ladishb.com/logo.png"
            style="height:40px"
          ></b-img>
          <span class="ml-auto">
            <b-button variant="link" to="/user/app">APP</b-button>
            <!-- <b-button variant="link" class="text-success">English</b-button> -->
          </span>
        </header>
      </b-col>
    </b-row>
    <b-row class="flex-grow-1 d-flex flex-column" no-gutters>
      <b-row no-gutters class="flex-grow-1 login-body">
        <b-col
          md="6"
          cols="0"
          class="md-block d-flex flex-column  justify-content-center"
          style="padding-left: 20%"
        >
          <span>
            <h3 class=" text-dark">物联网ITO监控服务平台</h3>
            <p class="text-dark">
              适用于数据中心,微模块机房,单体UPS,空调等设备监控
            </p>
          </span>
          <span>
            <b-img-lazy
              src="~/static/LADS_Uart.png"
              class=" w-50 d-block"
            ></b-img-lazy>
            <b>LADS透传平台小程序</b>
          </span>
        </b-col>
        <b-col
          ref="loginBody"
          cols="12"
          md="6"
          class="d-flex align-items-center justify-content-center"
        >
          <b-card class="shadow login">
            <b-card-body class="d-flex flex-column">
              <div class="d-flex flex-row mb-3">
                <h4 class="text-success login-left">登陆</h4>
                <div class="ml-auto">
                  <b-link
                    class="m-1 text-info"
                    :to="{ name: 'user-register' }"
                    >{{ $t("zhu-ce") }}</b-link
                  >
                  <b-link
                    class="m-1 ml-2 text-info"
                    :to="{ name: 'user-reset' }"
                    >{{ $t("zhong-zhi") }}</b-link
                  >
                </div>
              </div>
              <b-form class="mt-auto">
                <b-form-group label="账号:" label-for="user" v-bind="label">
                  <b-form-input
                    id="user"
                    v-model.trim="accont.user"
                    placeholder
                  />
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
                <b-button
                  id="login_submit"
                  block
                  variant="info"
                  class="mt-4"
                  @click="login_submit"
                >
                  {{ $t("deng-lu") }}
                  <span />
                </b-button>
              </b-form>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row class="mt-auto bg-footer" no-gutters>
        <b-col>
          <footer class="d-flex align-items-center px-3 py-1 flex-md-row">
            <b-link
              class="d-none d-sm-block px-1"
              href="https://www.ladis.com.cn"
              target="_blank"
              >雷迪司官网</b-link
            >
            <b-link
              class="d-none d-sm-block px-1"
              href="https://www.ladishb.com"
              target="_blank"
              >雷迪司湖北</b-link
            >
            <span class="ml-auto">
              <small>© 2019 All Rights Reserved 湖北雷迪司</small>
              <b-link href="http://www.beian.miit.gov.cn/">
                <small class="text-decoration-none text-dark"
                  >鄂ICP备19029626号-1</small
                >
              </b-link>
            </span>
          </footer>
        </b-col>
      </b-row>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import vue from "vue";
import { AES } from "crypto-js";
export default vue.extend({
  middleware: "checklogin",
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "3",
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
      const data = await this.$axios.$get("/api/auth/hash", { params: { user } }).catch((error: any) => { this.$bvModal.msgBoxOk(error?.response?.data || "流程出错", { size: "sm", buttonSize: "sm" }); });
      //
      if (!data?.hash || !passwd) return;
      this.$auth.loginWith("local", { data: { user, passwd: AES.encrypt(passwd, data.hash).toString() } })
        .then((data: any) => {
          localStorage.setItem("uartserverUser", data.data.user);
          //this.redit(data.data.userGroup);
        })
        .catch((error: any) => {
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
    }
  },
  mounted() {
    const user = localStorage.getItem("uartserverUser");
    if (user) this.accont.user = user;
  },/* 
  created() {
    console.log(this.query);
    this.accont.user = this.query.token
  } */
});
</script>
<style lang="scss" scoped>
a {
  color: black;
}
/* .login {
  min-width: 50%;
  height: 368px;
} */

@media screen and (max-width: 768px) {
  .login {
    max-width: 95%;
    margin: auto;
    min-width: 80%;
    //max-height: 90%;
  }
}
@media (max-width: 768px) {
  .md-block {
    display: none !important;
  }
}

.login-body {
  background-color: #ffffff;
  //background-image: url("https://img.alicdn.com/tfs/TB14xWackxz61VjSZFrXXXeLFXa-2400-1120.jpg");
  //background-image: url("../assets/backgrounpImg.jpg");
  background-size: contain;
  /* background-blend-mode:luminosity */
  //background-blend-mode: color-burn;
}
.bg-footer {
  background-color: #cad7e0;
}
</style>
