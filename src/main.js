import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueApexCharts from "vue3-apexcharts";
import VueGeolocation from "vue3-geolocation";
import Vue3Datatable from "@bhplugin/vue3-datatable";
createApp(App)
  .use(store)
  .use(router)
  .use(VueApexCharts)
  .use(VueGeolocation)
  .use(Vue3Datatable)
  .mount("#app");
