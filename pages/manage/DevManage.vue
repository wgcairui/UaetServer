<template>
  <div>
    <my-head title="设备管理"></my-head>
    <b-container>
      <b-row>
        <separated title="透传设备">
          <b-button variant="success" size="sm" @click="uartAdd = !uartAdd">{{
            !uartAdd ? "add" : "hide"
          }}</b-button>
        </separated>
        <b-collapse v-model="uartAdd" class=" w-100">
          <b-card>
            <b-form>
              <b-form-group label="设备Mac:" v-bind="label">
                <b-input-group>
                  <b-form-input></b-form-input>
                  <b-input-group-append>
                    <b-button>检索</b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-form>
          </b-card>
        </b-collapse>
      </b-row>
      <b-row>
        <separated title="环控设备"></separated>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import MyHead from "@/components/MyHead";
import separated from "@/components/separated";
export default {
  components: {
    MyHead,
    separated
  },
  data() {
    return {
      label: {
        labelCols: "12",
        labelColsSm: "2",
        labelAlignSm: "right"
      },
      uartAdd: false,
      uarts: []
    };
  }
};
</script>

<style scoped></style>
