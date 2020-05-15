<template>
  <div class=" d-flex flex-column h-100 w-100 overflow-hidden">
    <b-container class="flex-grow-1 overflow-auto">
      <b-row id="uart">
        <separated title="透传设备" />

        <b-col
          v-for="(link, key) in BindDevice.UTs"
          :key="key"
          cols="12"
          md="6"
          class=" mt-4"
        >
          <b-link
            :to="{ name: 'uart-main', query: { DevMac: link.DevMac } }"
            class=" text-decoration-none text-dark"
          >
            <b-card>
              <b-card-title>
                <i class=" iconfont">&#xec4a;</i>{{ link.name }}
              </b-card-title>
              <b-card-sub-title>&nbsp;&nbsp;{{ link.DevMac }}</b-card-sub-title>
              <b-card-body>
                <i class=" iconfont">&#xec24;</i>
                <span>{{
                  link.mountDevs.map(el => el.mountDev + el.pid).join(",")
                }}</span>
              </b-card-body>
            </b-card>
          </b-link>
        </b-col>
      </b-row>
      <b-row id="ECs">
        <separated title="环控设备" />
        <b-col
          v-for="(link, key) in BindDevice.ECs"
          :key="key"
          cols="12"
          md="6"
          class=" mt-4"
        >
          <b-link
            :to="{ name: 'index-EC', query: { ECid: link.ECid } }"
            class=" text-decoration-none text-dark"
          >
            <b-card>
              <b-card-title>
                <i class=" iconfont">&#xebd8;</i>{{ link.name }}
              </b-card-title>
              <b-card-sub-title>&nbsp;{{ link.ECid }}</b-card-sub-title>
              <b-card-body>
                <i class=" iconfont">&#xeb63;</i>
                <span>{{ link.model }}</span>
              </b-card-body>
            </b-card>
          </b-link>
        </b-col>
      </b-row>
    </b-container>
    <div class=" mt-auto w-100">
      <b-nav fill class="bg-info">
        <b-nav-item href="#ECs">
          <span class="text-light">环控</span>
        </b-nav-item>
        <b-nav-item href="#uart">
          <span class="text-light">透传</span>
        </b-nav-item>
      </b-nav>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import gql from "graphql-tag";
import separated from "../../components/separated.vue";
import { BindDevice } from "../../server/bin/interface";
export default Vue.extend({
  components: {
    separated
  },
  data() {
    return {
      BindDevice: {
        UTs: [],
        ECs: []
      }
    };
  },
  methods: {
    a() {
      // this.BindDevice.UTs.reduce();
    }
  },
  apollo: {
    BindDevice: {
      query: gql`
        query getUserBindDevice {
          BindDevice {
            UTs {
              DevMac
              name
              mountDevs {
                mountDev
                protocol
                pid
              }
            }
            ECs {
              ECid
              name
              model
            }
          }
        }
      `,
      fetchPolicy:"network-only",
      // update: data => data.BindDevice || { UTs: [], ECs: [] }
      result:function(data){
        const BindDevice = data.data.BindDevice as BindDevice
        console.log({BindDevice});
        
        if(!BindDevice || (BindDevice.UTs.length ===0 && BindDevice.ECs.length===0)) this.$router.push("/manage/DevManage")
      }
    }
  }
});
</script>
