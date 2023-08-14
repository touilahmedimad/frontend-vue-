<template>
  <AppLayout title="Dashboard">
    <div class="section">
      <div>
        <!-- Placeholder for any additional content you might want to add -->
      </div>

      <div
        v-for="data in uniqueLatestDebits"
        :key="data.debiMeter"
        class="box card-content has-background-dark"
      >
        <h2 class="title is-3 has-text-centered">{{ data.debiMeter.name }}</h2>

        <!-- Main content with two sections side-by-side -->
        <div class="columns">
          <!-- 1. Gauge and Status Section -->
          <div class="column">
            <!-- Gauge -->
            <div
              class="card card-content"
              style="display: flex; flex-direction: column; height: 100%"
            >
              <div class="card-content">
                <apexchart
                  :options="chartOptions"
                  :series="[(data.debit / 500) * 100]"
                  height="350"
                  type="radialBar"
                />

                <!-- Status indicators -->
                <div class="mt-4">
                  <span class="is-flex">
                    <span
                      class="icon is-small mr-2"
                      :class="
                        isOnline(data.date)
                          ? 'has-text-success'
                          : 'has-text-danger'
                      "
                    >
                      <i class="fas fa-circle"></i>
                    </span>
                    <span
                      :class="
                        isOnline(data.date)
                          ? 'has-text-success'
                          : 'has-text-danger'
                      "
                    >
                      {{ isOnline(data.date) ? "En ligne" : "Hors ligne" }}
                    </span>
                  </span>
                  <span class="has-text-grey-lighter"
                    >Last update: {{ timeSince(data.date) }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Google Maps Section -->
          <div class="column">
            <div
              class="card"
              style="display: flex; flex-direction: column; height: 100%"
            >
              <div class="card-content">
                <GoogleMaps :lat="data.latitude" :lng="data.longitude" />
              </div>
            </div>
          </div>
        </div>

        <!-- Additional components side-by-side -->
        <div class="columns">
          <div class="column"><PredictionResult /></div>
          <div class="column">
            <LineChart :data="filterDebitsByMeter(data.debiMeter)" />
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import axios from "axios";
import ReconnectingWebSocket from "reconnecting-websocket";
import Swal from "sweetalert2";
import GoogleMaps from "@/components/GoogleMaps.vue";
import PredictionResult from "@/components/PredictionResult.vue";
import LineChart from "@/components/LineChart.vue";

const latestDebits = ref([]);
const allData = ref([]);
const notification = ref("");
let socket;

onMounted(() => {
  fetchLatestDebits();
  initWebSocket();
});

onBeforeUnmount(() => {
  if (socket) {
    socket.close();
  }
});

const uniqueLatestDebits = computed(() => {
  let grouped = {};

  latestDebits.value.forEach((data) => {
    if (
      !grouped[data.debiMeter] ||
      new Date(grouped[data.debiMeter].date) < new Date(data.date)
    ) {
      grouped[data.debiMeter] = data;
    }
  });

  return Object.values(grouped);
});
function filterDebitsByMeter(meterId) {
  return this.allData.filter((item) => item.debiMeter === meterId);
}
const chartOptions = ref({
  chart: {
    height: 350,
    type: "radialBar",
    toolbar: {
      show: true,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 225,
      hollow: {
        margin: 0,
        size: "70%",
        background: "#fff",
        image: undefined,
        imageOffsetX: 0,
        imageOffsetY: 0,
        position: "front",
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 4,
          opacity: 0.24,
        },
      },
      track: {
        background: "#fff",
        strokeWidth: "67%",
        margin: 0,
        dropShadow: {
          enabled: true,
          top: -3,
          left: 0,
          blur: 4,
          opacity: 0.35,
        },
      },
      dataLabels: {
        show: true,
        name: {
          offsetY: -10,
          show: true,
          color: "#888",
          fontSize: "17px",
        },
        value: {
          formatter: function (val) {
            return Math.round((val / 100) * 500); // map back to original value
          },
          color: "#111",
          fontSize: "36px",
          show: true,
        },
      },
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      type: "horizontal",
      shadeIntensity: 0.5,
      gradientToColors: ["#ABE5A1"],
      inverseColors: true,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  stroke: {
    lineCap: "round",
  },
  labels: ["debit L/s"],
});

async function fetchLatestDebits() {
  try {
    const response = await axios.get(
      "http://elghaba-django-backend-5b524d8b9eef.herokuapp.com/api/v1/get-all-data"
    );
    latestDebits.value = response.data;
    allData.value = response.data;
  } catch (error) {
    console.error("Error fetching debit data:", error);
  }
}

function initWebSocket() {
  const url =
    "ws://elghaba-django-backend-5b524d8b9eef.herokuapp.com/notifications/";
  socket = new ReconnectingWebSocket(url);

  socket.addEventListener("message", (event) => {
    const mainData = JSON.parse(event.data);
    console.log("Received data: ", mainData);

    const data = mainData.data; // Extracting the nested 'data' property

    if (data && data.debiMeter !== undefined && data.debit !== undefined) {
      const newDebit = data.debit;
      const meterId = data.debiMeter;

      let meterIndex = allData.value.findIndex(
        (debit) => debit.debiMeter === meterId
      );

      if (meterIndex !== -1) {
        allData.value[meterIndex] = {
          ...allData.value[meterIndex],
          debit: newDebit,
          date: data.date,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      } else {
        allData.value.push(data);
      }
    }

    if (mainData.message) {
      notification.value = mainData.message;
      // Check if the message includes "Discrepancy detected"
      if (mainData.message.includes("Discrepancy detected")) {
        Swal.fire({
          title: "Error!",
          text: mainData.message,
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    }
  });
}

const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds

function isOnline(lastUpdate) {
  const currentTime = new Date();
  const updateTime = new Date(lastUpdate);
  return currentTime - updateTime < TEN_MINUTES;
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}
</script>
