<template>
  <b-row>
    <b-col>
      <b-form class="p-3">
        <b-form-group label="节点名称:" v-bind="forGroup">
          <b-form-input v-model="accont.Name" trim />
        </b-form-group>
        <b-form-group label="节点IP:" v-bind="forGroup">
          <b-form-input v-model="accont.IP" trim :state="statIP" />
        </b-form-group>
        <b-form-group label="节点端口:" v-bind="forGroup">
          <b-form-input v-model="accont.Port" trim :state="statPort" />
        </b-form-group>
        <b-form-group label="连接数限制:" v-bind="forGroup">
          <b-form-input v-model="accont.MaxConnections" trim :state="statMaxConnections" />
        </b-form-group>
        <b-button block @click="submit">提交</b-button>
      </b-form>
      <b-table-lite
        :items="Nodes"
        :fields="['Name', 'IP', 'Port', 'MaxConnections', 'oprate']"
        responsive
      >
        <template v-slot:cell(oprate)="row">
          <b-button @click="deleteNode(row.item)">delete</b-button>
        </template>
      </b-table-lite>
    </b-col>
  </b-row>
</template>
<script lang="ts">
import vue from "vue";
import gql from "graphql-tag";
import { NodeClient } from "uart";

export default vue.extend({
  data() {
    return {
      forGroup: { "label-align-md": "right", "label-cols-md": "2" },
      accont: {
        Name: "",
        IP: "",
        Port: 9000,
        MaxConnections: 2000
      },
      apolloIP: null,
      Nodes: []
    };
  },
  computed: {
    statIP() {
      return this.$data.accont.IP.split(".").length > 3;
    },
    statPort() {
      return this.$data.accont.Port > 3000;
    },
    statMaxConnections() {
      return this.$data.accont.MaxConnections < 2001;
    }
  },
  watch: {
    apolloIP(newVal) {
      if (newVal) {
        this.$data.accont.Name = newVal.Name;
        this.$data.accont.Port = newVal.Port;
        this.$data.accont.MaxConnections = newVal.MaxConnections;
        this.$bvToast.toast("节点已存在", { toaster: "b-toaster-top-full" });
      }
    }
  },
  apollo: {
    apolloIP: {
      query: gql`
        query getNodeIpSat($IP: String) {
          Node(IP: $IP) {
            Name
            IP
            Port
            MaxConnections
          }
        }
      `,
      variables() {
        return {
          IP: this.$data.accont.IP
        };
      },
      update: data => data.Node,
      skip() {
        return this.$data.accont.IP.split(".").length < 4;
      }
    },
    Nodes: gql`
      {
        Nodes {
          Name
          IP
          Port
          MaxConnections
        }
      }
    `
  },
  methods: {
    submit() {
      if (!this.statIP || !this.statPort || !this.statMaxConnections) {
        this.$bvModal.msgBoxOk("参数不合法!!");
        return;
      }
      const accont = this.accont;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation setOrgetNode($arg: String) {
              setNode(arg: $arg) {
                ok
                msg
              }
            }
          `,
          variables: {
            arg: JSON.stringify(accont)
          }
        })
        .then(res => {
          this.$apollo.queries.Nodes.refresh();
          this.$bvModal.msgBoxOk("添加节点成功", { buttonSize: "sm" });
        });
    },
    deleteNode(item: NodeClient) {
      this.$apollo
        .mutate({
          mutation: gql`
            mutation deleteNode($IP: String) {
              deleteNode(IP: $IP) {
                ok
                msg
              }
            }
          `,
          variables: {
            IP: item.IP
          }
        })
        .then(() => this.$apollo.queries.Nodes.refresh());
    }
  }
});
</script>
