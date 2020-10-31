<template>
  <b-modal title="验证权限" :id="id" @change="show" button-size="sm" ok-variant="light" cancel-disabled>
    <b-form>
      <b-form-group :label="tels">
        <b-input-group size="sm">
          <b-input-group-prepend>
            <b-button
              variant="outline-info"
              @click="sendValidationSms"
              :disabled="validationStat"
            >{{validationStat?'已发送':'发送短信'}}</b-button>
          </b-input-group-prepend>
          <b-form-input v-model="validation" trim />
          <b-input-group-append>
            <b-button :disabled="!validation" @click="ValidationCode(validation)">确认</b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>
    </b-form>
  </b-modal>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
export default Vue.extend({
  props: {
    id: {
      default: "smsValidation",
      type: String
    }
  },
  data() {
    return {
      tels: "",
      validation: "",
      validationStat: false
    };
  },
  apollo: {},
  methods: {
    show() {
      this.$apollo
        .query({
          query: gql`
            query getTel {
              getUserTel
            }
          `
        })
        .then(el => {
          this.tels = `是否通过${el.data.getUserTel}短信验证账户`;
        });
    },
    // 发送校验码
    async sendValidationSms() {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation sendValidationSms {
            sendValidationSms {
              ok
              msg
              arg
            }
          }
        `
      });
      const stat = result.data.sendValidationSms as Uart.ApolloMongoResult;
      if (!stat) return this.$bvModal.msgBoxOk("请求过程出错");
      if (stat.ok === 0) return this.$bvModal.msgBoxOk("验证短信发送失败");
      this.validationStat = true;
      setTimeout(() => {
        this.validationStat = false;
      }, 60000);
    },
    // 验证校验码
    async ValidationCode(code: string) {
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation ValidationCode($code: String) {
            ValidationCode(code: $code) {
              ok
              msg
            }
          }
        `,
        variables: { code }
      });
      const ValidationCode = result.data.ValidationCode as Uart.ApolloMongoResult;
      if (!ValidationCode) return this.$bvModal.msgBoxOk("请求过程出错");
      if (ValidationCode.ok === 0)
        return this.$bvModal.msgBoxOk(ValidationCode.msg);
      this.$bvModal.hide(this.id);
    }
  }
});
</script>