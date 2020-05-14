<template>
  <div>
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
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { OprateInstruct, ApolloMongoResult } from "../server/bin/interface";
import gql from "graphql-tag";
export default Vue.extend({
  props: ["query"],
  data() {
    return {
      querys: this.query,
      loading: false,
      ok: "",
      msg: "",
      tempVal: "",
      //
      OprateInstruct: [] as OprateInstruct[]
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
    async SendOprateInstruct(item: OprateInstruct) {
      if (item.value.includes("%")) {
        const value = prompt(`请输入指令<${item.name}> 的值:`);
        console.log(value);
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
      const R = result.data.SendProcotolInstructSet as ApolloMongoResult;
      this.$data.ok = R.ok;
      this.$data.msg = R.msg;
      if(R.ok === 4){
        // 权限不够,要求用户短信验证权限
        this.$bvModal.show("sms1")
      }
    }
  }
});
</script>