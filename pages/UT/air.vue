<template>
  <div>
    <my-head title="空调">
      <b-container>
        <b-row>
          <b-col cols="12" md="8">
            <b-img-lazy src="" />
          </b-col>
        </b-row>
      </b-container>
    </my-head>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import MyHead from "../../components/MyHead.vue";
export default Vue.extend({
  components: { MyHead },
  data() {
    return {};
  }
});
</script>