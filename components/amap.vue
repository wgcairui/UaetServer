<template>
  <div :id="id" class="map" :style="{height}"></div>
</template>
<script lang="ts">
import Vue from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
export default Vue.extend({
  props: {
    id: {
      default: "amap"
    },
    opt: {
      default() {
        return {
          center: [113.975299479167, 29.924395345053],
          zoom: 4
        } as AMap.Map.Options;
      }
    },
    height:{
        default:500
    },
    amapKey: {
      default: "2bbc666ac8e6a9d69c2910a7053243b6"
    }
  },
  mounted() {
    AMapLoader.load({
      key: this.amapKey,
      version: "2.0",
      plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.Geolocation"]
    })
      .then(Amap => {
        const map = new AMap.Map(this.id, this.opt);
        map.addControl(new Amap.Geolocation());
        map.addControl(new Amap.ToolBar());
        map.addControl(new Amap.Scale());
        this.$emit("ready", map);
      })
      .catch(e => {
        console.log(e);
      });
  }
});
</script>
<style lang="scss" scoped>
.map {
  height: 500px;
  width: 100%;
}
</style>