<template>
  <b-container fluid class=" d-flex flex-column h-100 p-0">
    <my-head title="登录"></my-head>
    <b-row class=" flex-grow-1" no-gutters>
      <b-col
        cols="12"
        ref="loginBody"
        class="d-flex align-items-center justify-content-center"
      >
        <b-card class="shadow login p-3 ">
          <b-card-body class="d-flex flex-column h-100">
            <div class=" d-flex flex-row mb-3">
              <h4 class="text-success login-left">login</h4>
              <div class=" ml-auto">
                <b-link class="m-1 text-info" :to="{ name: 'user-register' }">
                  注册
                </b-link>
                <b-link class="m-1 ml-2 text-info" :to="{ name: 'user-reset' }"
                  >重置</b-link
                >
              </div>
            </div>
            <b-form class=" mx-3 mt-auto">
              <b-form-group label="账号:" label-for="user" v-bind="label">
                <b-form-input
                  id="user"
                  v-model.trim="accont.user"
                  placeholder
                ></b-form-input>
              </b-form-group>
              <b-form-group label="密码:" label-for="passwd" v-bind="label">
                <b-form-input
                  id="passwd"
                  type="password"
                  v-model.trim="accont.passwd"
                  placeholder
                ></b-form-input>
              </b-form-group>
              <b-button
                id="login_submit"
                @click="login_submit"
                block
                variant="info"
                class=" mt-4"
              >
                登录
                <span></span>
              </b-button>
            </b-form>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import MyHead from "~/components/MyHead";
export default {
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
        user: "admin",
        passwd: "123456"
      }
    };
  },
  methods: {
    login_submit() {
      let { user, passwd } = this.$data.accont;

      this.$auth
        .loginWith("local", { data: { user, passwd } })

        .catch((error) => {
          if (!error.response || error.response.status !== 400)
            return this.$bvModal.msgBoxOk("登录遇到未知错误");
          switch (error.response.data.error) {
            case "userNan":
              this.$bvModal.msgBoxOk("用户名错误");
              break;
            case "passwdError":
              this.accont.passwd = "";
              this.$bvModal.msgBoxOk("用户密码错误");
              break;
          }
        });
    }
  }
};
</script>
<style scoped>
@media screen and (min-width: 568px) {
  .login {
    min-width: 500px;
    height: 368px;
  }
}
</style>
