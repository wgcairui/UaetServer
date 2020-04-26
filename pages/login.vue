<template>
  <b-container fluid class="d-flex flex-column h-100 p-0">
    <my-head title="登录" />
    <b-row class="flex-grow-1" no-gutters>
      <b-col
        ref="loginBody"
        cols="12"
        class="d-flex align-items-center justify-content-center"
      >
        <b-card class="shadow login p-3">
          <b-card-body class="d-flex flex-column h-100">
            <div class="d-flex flex-row mb-3">
              <h4 class="text-success login-left">
                login
              </h4>
              <div class="ml-auto">
                <b-link class="m-1 text-info" :to="{ name: 'user-register' }">
                  {{$t('zhu-ce')}}
                </b-link>
                <b-link class="m-1 ml-2 text-info" :to="{ name: 'user-reset' }">
                  {{$t('zhong-zhi')}}
                </b-link>
              </div>
            </div>
            <b-form class="mx-3 mt-auto">
              <b-form-group :label="$t("zhang-hao")" label-for="user" v-bind="label">
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
                />
              </b-form-group>
              <b-button
                id="login_submit"
                block
                variant="info"
                class="mt-4"
                @click="login_submit"
              >
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
      try {
        const result = await this.$auth.loginWith("local", {
          data: { user, passwd }
        });
        console.log({ result });
      } catch (error) {
        console.log({ error, keys: Object.keys(error) });

        if (!error.response || error.response.status !== 400) {
          this.$bvModal.msgBoxOk("登录遇到未知错误");
          return;
        } else {
          console.log(error.response);

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
      }
    }
  }
});
</script>
<style scoped>
@media screen and (min-width: 568px) {
  .login {
    min-width: 500px;
    height: 368px;
  }
}
</style>
