<template>
  <GoogleMap
    api-key="AIzaSyAinHNviy7MTIAVv8-kQB108lMJkqrybAk"
    style="width: 100%; height: 500px"
    :center="center"
    :zoom="15"
  >
    <Marker :options="{ position: center }" />
  </GoogleMap>
</template>
<script>
import { defineComponent, toRefs, computed } from "vue";
import { GoogleMap, Marker } from "vue3-google-map";
export default defineComponent({
  props: ["lat", "lng"],
  components: { GoogleMap, Marker },
  setup(props) {
    const { lat, lng } = toRefs(props);
    const center = computed(() => ({
      lat: Number(lat.value),
      lng: Number(lng.value),
    }));
    return { center };
  },
});
</script>
