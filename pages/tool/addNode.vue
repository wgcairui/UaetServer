<template>
  <div>
    <my-head title="添加节点"></my-head>
    <b-form class="p-3">
      <b-form-group label="节点名称:" v-bind="forGroup">
        <b-form-input trim v-model="accont.Name"></b-form-input>
      </b-form-group>
      <b-form-group label="节点IP:" v-bind="forGroup">
        <b-form-input trim v-model="accont.IP" :state="statIP"></b-form-input>
      </b-form-group>
      <b-form-group label="节点端口:" v-bind="forGroup">
        <b-form-input
          trim
          v-model="accont.Port"
          :state="statPort"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="连接数限制:" v-bind="forGroup">
        <b-form-input
          trim
          v-model="accont.MaxConnections"
          :state="statMaxConnections"
        ></b-form-input>
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
  </div>
</template>
<script>
//import Vuenotifications from "vue-notifications"
import MyHead from '@/components/MyHead'
import gql from "graphql-tag";
export default {
  components:{
    MyHead
  },
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
      return this.accont.IP.split(".").length > 3;
    },
    statPort() {
      return this.accont.Port > 3000;
    },
    statMaxConnections() {
      return this.accont.MaxConnections < 2001;
    }
  },
  watch: {
    apolloIP: function(newVal) {
      if (newVal) {
        this.accont.Name = newVal.Name;
        this.accont.Port = newVal.Port;
        this.accont.MaxConnections = newVal.MaxConnections;
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
          IP: this.accont.IP
        };
      },
      update: (data) => data.Node,
      skip() {
        return this.accont.IP.split(".").length < 4;
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
        return this.$bvModal.msgBoxOk("参数不合法!!");
      }
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
            arg: JSON.stringify(this.$data.accont)
          }
        })
        .then((res) => {
          this.$apollo.queries.Nodes.refresh();
          this.$bvModal.msgBoxOk("添加节点成功");
        });
    },
    deleteNode(item) {
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
};
</script>
