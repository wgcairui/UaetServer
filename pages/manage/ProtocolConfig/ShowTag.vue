<template>
  <my-page-manage title="协议显示标签配置" :isUser="false">
    <b-row>
      <b-col>
        <separated title="add Sim"></separated>
        <p>{{ShowTag}}</p>
        <b-table :items="items">
          <template v-slot:cell(show)="row">
            <b-form-checkbox v-model="row.value" @change="selects(row.item)"></b-form-checkbox>
          </template>
        </b-table>
      </b-col>
    </b-row>
  </my-page-manage>
</template>

<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import { protocol } from "../../../server/bin/interface";
interface tags {
  name: string;
  show: boolean;
}
export default Vue.extend({
  data() {
    const { ProtocolType, Protocol } = this.$route.query;
    return {
      ProtocolType,
      Protocol,
      ProtocolSingle: null,
      ShowTag: []
    };
  },
  computed: {
    items: {
      get() {
        const ProtocolSingle: protocol = this.$data.ProtocolSingle;
        const ShowTag: string[] = this.$data.ShowTag;
        const result: tags[] = [];
        if (ProtocolSingle) {
          ProtocolSingle.instruct.forEach(el => {
            el.formResize.forEach(ep => {
              result.push({ name: ep.name, show: ShowTag.includes(ep.name) });
            });
          });
        }
        return result;
      }
    }
  },
  apollo: {
    ProtocolSingle: {
      query: gql`
        query getProtocol($Protocol: String) {
          ProtocolSingle: Protocol(Protocol: $Protocol) {
            instruct {
              formResize
            }
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      }
    },
    ShowTag: {
      query: gql`
        query getDevConstant($Protocol: String) {
          ShowTag: getDevConstant(Protocol: $Protocol) {
            ShowTag
          }
        }
      `,
      variables() {
        return { Protocol: this.$data.Protocol };
      },
      update: data => data.ShowTag?.ShowTag
    }
  },
  methods: {
    selects(item: tags) {
      const ShowTag = this.ShowTag as string[];
      if (ShowTag.includes(item.name)) {
        const index = ShowTag.indexOf(item.name);
        ShowTag.splice(index, 1, "");
      } else {
        ShowTag.push(item.name);
      }
      // 刷选出协议已经不存在的参数
      const protocolArgstr = this.items.map(el => el.name);
      const arg = Array.from(
        new Set(ShowTag.filter(el => el && protocolArgstr.includes(el)))
      );
      const { ProtocolType, Protocol } = this.$data as any;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addDevConstent(
              $Protocol: String
              $ProtocolType: String
              $type: String
              $arg: JSON
            ) {
              addDevConstent(
                Protocol: $Protocol
                ProtocolType: $ProtocolType
                type: $type
                arg: $arg
              ) {
                ok
                msg
                upserted
              }
            }
          `,
          variables: {
            arg,
            Protocol,
            type: "ShowTag",
            ProtocolType
          }
        })
        .then(() => {
          this.$apollo.queries.ShowTag.refresh();
        });
    }
  }
});
</script>

<style scoped></style>
