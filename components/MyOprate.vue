<template>
  <b-modal
    size="lg"
    title="指令操作"
    :id="id"
    ok-only
    button-size="sm"
    ok-title="关闭"
    ok-variant="default"
    header-bg-variant="dark"
    header-text-variant="light"
  >
    <b-row no-gutters>
      <!-- <b-col>
        <b-button
          v-for="val in OprateInstruct"
          :key="val.name"
          v-b-tooltip.hover
          :title="val.readme"
          @click="SendOprateInstruct(val)"
          class="m-3"
        >{{val.name}}</b-button>
      </b-col>-->
      <b-col>
        <b-card sub-title="快捷指令">
          <b-list-group>
            <b-list-group-item
              v-for="val in OprateInstruct"
              :key="val.name"
              v-b-tooltip.hover
              :title="val.readme"
              @click="SendOprateInstruct(val)"
              button
            >
              <b>{{val.name}}</b>
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </b-col>
    </b-row>
    <b-row no-gutters>
      <b-col>
        <b-card class="my-2">
          <b-card-sub-title v-b-toggle.collapse-1>自定义指令</b-card-sub-title>
          <b-collapse id="collapse-1" class="my-3">
            <b-form>
              <my-form label="指令内容:">
                <b-form-input v-model="tempVal" placeholder="232协议直接输入字符串,485指令不要添加地址码和校验码"></b-form-input>
              </my-form>
              <b-button
                block
                @click="SendOprateInstruct({value:tempVal})"
                size="sm"
                variant="info"
              >发送</b-button>
            </b-form>
          </b-collapse>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-overlay :show="loading">
          <b-card>
            <p>
              <b>状态码:</b>
              {{ok}}
            </p>
            <p>
              <b>返回值:</b>
              {{msg}}
            </p>
          </b-card>
        </b-overlay>
      </b-col>
    </b-row>
    <sms-validation id="sms1"></sms-validation>
  </b-modal>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { MessageBox } from "element-ui";
import "element-ui/lib/theme-chalk/message-box.css";
export default Vue.extend({
  props: {
    query: {
      type: Object
    },
    id: {
      type: String,
      default: "OprateInstructMode"
    }
  },
  data() {
    return {
      querys: this.query,
      loading: false,
      ok: "",
      msg: "",
      tempVal: "",
      //
      OprateInstruct: [] as Uart.OprateInstruct[]
    };
  },
  apollo: {
    OprateInstruct: {
      query: gql`
        query getDevConstant($Protocol: String) {
          OprateInstruct: getDevConstant(Protocol: $Protocol) {
            ProtocolType
            OprateInstruct {
              name
              value
              bl
              readme
            }
          }
        }
      `,
      variables() {
        return {
          Protocol: this.$data.querys.protocol
        };
      },
      update: data => data.OprateInstruct.OprateInstruct || []
    }
  },
  methods: {
    async SendOprateInstruct(item: Uart.OprateInstruct) {
      if (item.value.includes("%i")) {
        //const value = prompt(`请输入指令<${item.name}> 的值:`);
        //this.$bvModal.hide("OprateInstructMode");
        const content = document.getElementById(
          "OprateInstructMode___BV_modal_content_"
        ) as HTMLElement;
        content.removeAttribute("tabIndex");
        const value = await MessageBox.prompt("请输入改变的值:", {
          inputPlaceholder: "仅支持正负数字"
        })
          .then(data => {
            const value = Number((data as any).value);
            return Number.isNaN(value) ? 0 : value;
          })
          .catch(e => {
            console.log("用户取消输入");
            return 0;
          });
        if (!value) return;
        item.val = value;
      }
      const query = this.$data.querys;
      this.$data.loading = true;
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation SendProcotolInstructSet($query: JSON, $item: JSON) {
            SendProcotolInstructSet(query: $query, item: $item) {
              ok
              msg
            }
          }
        `,
        variables: {
          query,
          item
        }
      });
      this.$data.loading = false;
      const R = result.data.SendProcotolInstructSet as Uart.ApolloMongoResult;
      this.$data.ok = R.ok;
      this.$data.msg = R.msg;
      if (R.ok === 4) {
        // 权限不够,要求用户短信验证权限
        this.$bvModal.show("sms1");
      }
    }
  }
});
</script>
<style lang="scss" scoped>
</style>