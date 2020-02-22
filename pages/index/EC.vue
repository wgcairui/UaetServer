<template>
  <div class="d-flex flex-column w-100">
    <b-container fluid class="flex-grow-1 d-flex flex-column">
      <b-row no-gutters class="py-2">
        <b-col cols="4" class="text-center p-0">
          <switch-quantity title="烟感" />
        </b-col>
        <b-col cols="4" class="text-center p-0">
          <switch-quantity title="漏水" />
        </b-col>
        <b-col cols="4" class="text-center p-0">
          <switch-quantity title="门禁" />
        </b-col>
      </b-row>
      <b-row
        no-gutters
        class="flex-grow-1 alarm-content py-3 mh-100 overflow-hidden"
      >
        <b-col class="overflow-auto mh-100">
          <b-list-group id="alarm-list" />
        </b-col>
      </b-row>
      <b-row no-gutters class="border-top statu-padding">
        <b-col cols="6" sm="3">
          <span class="text-Critical">
            <i class="iconfont text-success ico">&#xe606;</i>
            ups负载
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-primary ico">&#xe600;</i>
            UPS功率
          </span>
        </b-col>

        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-success ico">&#xe603;</i>
            电池电压
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-info ico">&#xe605;</i>
            电池容量Kw
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-success ico">&#xe604;</i>
            冷通道温度&#8451;
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-primary ico">&#xe601;</i>
            冷通道湿度%
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-danger ico">&#xe604;</i>
            热通道温度&#8451;
          </span>
        </b-col>
        <b-col cols="6" sm="3" class="m-0 p-0">
          <span class="text-Critical">
            <i class="iconfont text-warning ico">&#xe601;</i>
            热通道湿度%
          </span>
        </b-col>
      </b-row>
    </b-container>
    <b-nav fill class="bg-info w-100 mt-auto">
      <b-nav-item :to="{ path: '/dev/ups' }">
        <span class="text-light">UPS</span>
      </b-nav-item>
      <b-nav-item :to="{ path: '/dev/ac' }">
        <span class="text-light">Air</span>
      </b-nav-item>
      <b-nav-item :to="{ path: '/dev/power' }">
        <span class="text-light">Em</span>
      </b-nav-item>
      <b-nav-item :to="{ path: '/Device/io' }">
        <span class="text-light">IO</span>
      </b-nav-item>
      <b-nav-item :to="{ path: '/dev/th' }">
        <span class="text-light">Th</span>
      </b-nav-item>
    </b-nav>
  </div>
</template>
<script lang="ts">
import Vue from "vue"
import switchQuantity from "../../components/switchQuantity.vue"

export default Vue.extend({
  components: {
    switchQuantity
  },
  data() {
    return {
      ECid: this.$route.query.ECid
    }
  }
})
</script>

<style scoped>
.text-Critical {
  font-size: 15px;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid #dee2e6;
}
.ico {
  font-size: 24px;
}
</style>
