<template>
  <b-container fluid>
    <headers title="add Terminal"></headers>
    <b-container>
      <b-form class=" py-4">
        <b-form-group label="设备Mac:" label-align-sm="right" label-cols-md="2">
          <b-form-input
            number
            trim
            v-model="accont.DevMac"
            :state="state.DevMac"
          ></b-form-input>
        </b-form-group>
        <b-form-group
          label="设备别名:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-input trim v-model="accont.name"></b-form-input>
        </b-form-group>
        <b-form-group
          label="注册节点:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select
            v-model="accont.mountNode"
            :options="list.mountNode"
          ></b-form-select>
        </b-form-group>
        <b-form-group
          label="挂载设备:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select
            v-model="accont.mountDev"
            :options="list.mountDev"
          ></b-form-select>
        </b-form-group>
        <b-form-group
          label="协议类型:"
          label-align-sm="right"
          label-cols-md="2"
        >
          <b-form-select
            v-model="accont.protocol"
            :options="list.protocol"
          ></b-form-select>
        </b-form-group>
        <b-button block>提交</b-button>
      </b-form>
    </b-container>
  </b-container>
</template>
<script>
import Headers from "~/components/Header.vue";
export default {
  components: {
    Headers
  },
  data() {
    return {
      accont: {
        DevMac: "",
        name: "",
        mountNode: "",
        mountDev: "",
        protocol: ""
      },
      list: {
        mountNode: [1, 2, 3],
        mountDev: [],
        protocol: []
      },
      state: {
        DevMac: false
      }
    };
  }
};
</script>
