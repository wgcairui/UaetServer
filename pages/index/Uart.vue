<template>
  <div class=" d-flex flex-row h-100 w-100">
    <div class=" mt-auto w-100">
      <b-nav fill class="bg-info">
        <b-nav-item>
          <span class="text-light">环控</span>
        </b-nav-item>
        <b-nav-item>
          <span class="text-light">透传</span>
        </b-nav-item>
      </b-nav>
    </div>
  </div>
</template>
<script>
import gql from "graphql-tag";
export default {
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
          }
        }
      `
    }
  }
};
</script>
