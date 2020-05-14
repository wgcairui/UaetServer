<template>
  <b-modal title="验证权限" :id="id" @change="show" button-size="sm" ok-variant="light" cancel-disabled>
    <b-form>
      <b-form-group :label="tels">
        <b-input-group size="sm">
          <b-input-group-prepend>
            <b-button variant="outline-info" @click="sendValidationSms">发送短信</b-button>
          </b-input-group-prepend>
          <b-form-input v-model="validation" trim />
          <b-input-group-append>
            <b-button :disabled="!validation">确认</b-button>
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
      validation: ""
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
    //
    sendValidationSms(){
        this.$apollo.mutate({
            mutation:gql`
            mutation sendValidationSms{
                sendValidationSms{
                    ok
                    msg
                }
            }
            `
        })
    }
  }
});
</script>