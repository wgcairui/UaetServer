<template>
  <div class=" d-flex flex-column h-100 w-100 overflow-hidden">
    <b-container class="flex-grow-1 overflow-auto">
      <b-row id="uart">
        <separated title="透传设备" />

        <b-col
          cols="12"
          md="6"
          class=" mt-4"
          v-for="(link, key) in BindDevice.UTs"
          :key="key"
        >
          <b-card>
            <b-card-title
              ><i class=" iconfont">&#xec4a;</i>{{ link.name }}</b-card-title
            >
            <b-card-sub-title>&nbsp;&nbsp;{{ link.DevMac }}</b-card-sub-title>
            <b-card-body>
              <i class=" iconfont">&#xec24;</i>
              <span>{{
                link.mountDevs.reduce(
                  (res, cur) => res + cur.mountDev + cur.pid + ",",
                  ""
                )
              }}</span>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <b-row id="ECs">
        <separated title="环控设备" />
        <b-col
          cols="12"
          md="6"
          class=" mt-4"
          v-for="(link, key) in BindDevice.ECs"
          :key="key"
        >
          <b-card>
            <b-card-title
              ><i class=" iconfont">&#xebd8;</i>{{ link.name }}</b-card-title
            >
            <b-card-sub-title>&nbsp;{{ link.ECid }}</b-card-sub-title>
            <b-card-body>
              <i class=" iconfont">&#xeb63;</i>
              <span>{{ link.model }}</span>
            </b-card-body>
          </b-card>
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
<script>
import gql from "graphql-tag";
import separated from "@/components/separated";
export default {
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
      this.BindDevice.UTs.reduce();
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
      update: (data) => data.BindDevice || { UTs: [], ECs: [] }
    }
  }
};
</script>
