<template>
  <b-row class="h-100">
    <b-col class="overflow-auto h-100">
      <b-row>
        <b-col>
          <separated title="DTU调试" :back="false"></separated>
          <my-form label="DTU列表">
            <b-select :options="Terminals" v-model="DevMac"></b-select>
          </my-form>
          <my-form label="AT指令">
            <b-input v-model="AT"></b-input>
          </my-form>
          <b-button @click="OprateAT" block size="sm">执行</b-button>
        </b-col>
      </b-row>
      <b-row class="my-4">
        <b-col>
          <b-overlay :show="$apollo.loading">
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
    </b-col>
  </b-row>
</template>
<script lang="ts">
import Vue from 'vue'
import gql from "graphql-tag";
export default Vue.extend({
  data() {
    return {
      Terminals: [],
      DevMac: '',
      AT: 'VER',
      ok: "",
      msg: "",
    }
  },
  apollo: {
    Terminals: {
      query: gql`
        query TerminalsInfo {
          Terminals {
            DevMac
            name
          }
        }
      `,
      update: data => {
        return data.Terminals.map(el => ({
          text: el.name,
          value: el.DevMac
        }))
      }
    }
  },
  methods: {
    async OprateAT() {
      const { DevMac, AT } = this.$data
      const result = await this.$apollo.mutate({
        mutation: gql`
          mutation Send_DTU_AT_InstructSet($DevMac:String,$content:String){
              Send_DTU_AT_InstructSet(DevMac:$DevMac,content:$content){
                  ok
                  msg
              }
          }
          `,
        variables: {
          DevMac,
          content: AT
        }
      })
      console.log(result);
      const R = result.data.Send_DTU_AT_InstructSet as ApolloMongoResult;
      this.ok = R.ok;
      this.msg = R.msg;
    }
  }
})
</script>