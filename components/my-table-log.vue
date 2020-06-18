<template>
  <div>
    <b-table
      id="my-table"
      :items="item"
      :per-page="perPage"
      :current-page="currentPage"
      :fields="cfields"
      :filter="new RegExp(cfilter)"
      hover
      :busy="busy"
      responsive
    >
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>Loading...</strong>
        </div>
      </template>
      <template v-slot:cell(ids)="row">{{(currentPage*10-10)+(row.index+1)}}</template>
      <slot/>
    </b-table>
    <b-pagination
      v-if="item.length>10"
      pills
      align="center"
      v-model="currentPage"
      :total-rows="item.length"
      :per-page="perPage"
      aria-controls="my-table"
    ></b-pagination>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { BvTableFieldArray } from "bootstrap-vue";
export default Vue.extend({
  props: {
    items: {
      type: Array,
      default: []
    },
    fields: {
      type: Array,
      default: []
    },
    filter: {
      type: String,
      default: ""
    },
    busy: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      perPage: 10,
      currentPage: 1
    };
  },
  computed: {
    item(){
      const items = this.items as any[]
      return items.reverse()
    },
    cfilter(){
      let filter = this.filter as string
      const patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im;
      return [...filter].map(el=>patrn.test(el)?'\\'+el:el).join('')
    },
    cfields() {
      const fields = this.fields as BvTableFieldArray;
      fields.unshift({ key: "ids", label: "id" });
      fields.push({
        key: "createdAt",
        label: "时间",
        formatter: data => new Date(data).toLocaleString()
      });      
      return fields
    }
  }
});
</script>