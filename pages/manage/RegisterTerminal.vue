<template>
  <my-page-user title="添加终端" :isUser="false">
    <b-row>
      <b-col>
        <separated title="注册设备"></separated>
        <b-card>
          <b-form class="p-5">
            <my-form label="设备IMEI:">
              <b-form-input :state="accont.DevMac !== ''" v-model="accont.DevMac" trim />
            </my-form>
            <b-form-group label="注册节点:" label-align-sm="right" label-cols-md="2">
              <b-form-select
                :disabled="isRegisterTerminal"
                v-model="accont.mountNode"
                :options="Nodes"
              />
            </b-form-group>

            <b-button
              size="sm"
              variant="info"
              block
              @click="addRegisterTerminal"
              :disabled="isRegisterTerminal"
            >{{ isRegisterTerminal ? "设备已登记" : "提交" }}</b-button>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <separated title="注册设备列表"></separated>
        <b-table-lite :items="RegisterTerminalsItems" :fields="RegisterTerminalsFields">
          <template v-slot:cell(oprate)="row">
            <b-button-group>
              <b-button
                size="sm"
                variant="info"
                :to="{
                    name: 'manage-addTerminal',
                    query: {
                      DevMac: row.item.DevMac
                    }
                  }"
              >注册设备</b-button>
              <b-button
                size="sm"
                variant="danger"
                @click="deleteRegisterTerminal(row.item.DevMac)"
              >Delete</b-button>
            </b-button-group>
          </template>
        </b-table-lite>
      </b-col>
    </b-row>
  </my-page-user>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import {
  RegisterTerminal,
  ApolloMongoResult
} from "../../server/bin/interface";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  data() {
    return {
      accont: {
        DevMac: "",
        mountNode: ""
      },
      Nodes: [],
      RegisterTerminal: null,
      RegisterTerminals: [],
      RegisterTerminalsFields: [
        { key: "DevMac", label: "设备ID" },
        { key: "mountNode", label: "挂载节点" },
        { key: "oprate", label: "操作" }
      ] as BvTableFieldArray
    };
  },
  computed: {
    isRegisterTerminal() {
      const RegisterTerminal = this.$data.RegisterTerminal;
      return Boolean(RegisterTerminal);
    },
    RegisterTerminalsItems() {
      const DevMac = this.$data.accont.DevMac;
      const RegisterTerminals: RegisterTerminal[] = this.$data
        .RegisterTerminals;
      return RegisterTerminals.filter(el =>
        el.DevMac.includes(DevMac)
      ).reverse();
    }
  },

  watch: {
    RegisterTerminal: function(newVal) {
      if (newVal) {
        this.$data.accont.mountNode = newVal.mountNode;
      }
    }
  },

  apollo: {
    Nodes: {
      query: gql`
        query {
          Nodes {
            text: Name
            value: Name
          }
        }
      `,
      update: data => data.Nodes
    },
    RegisterTerminal: {
      query: gql`
        query getRegisterTerminal($DevMac: String) {
          RegisterTerminal(DevMac: $DevMac) {
            DevMac
            mountNode
          }
        }
      `,
      variables() {
        const DevMac = this.$data.accont.DevMac;
        return {
          DevMac
        };
      },
      skip() {
        const DevMac: string = this.$data.accont.DevMac;
        return DevMac.length < 5;
      }
    },
    RegisterTerminals: {
      query: gql`
        query getRegisterTerminal($NodeName: String) {
          RegisterTerminals(NodeName: $NodeName) {
            DevMac
            mountNode
          }
        }
      `,
      variables() {
        return {
          NodeName: this.$data.accont.mountNode
        };
      }
    }
  },
  methods: {
    addRegisterTerminal() {
      let { DevMac, mountNode } = this.$data.accont;
      if (DevMac === "" || mountNode === "") {
        this.$bvModal.msgBoxOk("参数error", { title: "error" });
        return;
      }
      this.$apollo
        .mutate({
          mutation: gql`
            mutation addRegisterTerminal($DevMac: String, $mountNode: String) {
              addRegisterTerminal(DevMac: $DevMac, mountNode: $mountNode) {
                ok
                msg
              }
            }
          `,
          variables: {
            DevMac,
            mountNode
          }
        })
        .then(res => {
          this.$bvToast.toast("添加节点成功", { title: "success" });
          this.$apollo.queries.RegisterTerminals.refresh();
        });
    },
    async deleteRegisterTerminal(DevMac: string) {
      const res = await this.$apollo.mutate({
        mutation: gql`
          mutation deleteRegisterTerminal($DevMac: String) {
            deleteRegisterTerminal(DevMac: $DevMac) {
              ok
              msg
            }
          }
        `,
        variables: {
          DevMac
        }
      });

      const result: ApolloMongoResult = res.data.deleteRegisterTerminal;
      if (result.ok === 0) {
        this.$bvModal.msgBoxOk(result.msg, { title: "Info" });
      } else {
        this.$bvModal.msgBoxOk("delete success", { title: "Info" });
        this.$apollo.queries.RegisterTerminals.refresh();
      }
    }
  }
});
</script>
