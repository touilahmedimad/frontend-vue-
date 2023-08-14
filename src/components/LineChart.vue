<template>
  <div class="column has-background-white has-text-white">
    Line Chart
    <apexchart
      ref="lineChart"
      type="line"
      :options="lineChartOptions"
      :series="lineChartSeries"
    ></apexchart>
  </div>
</template>

<script>
export default {
  name: "LineChart",
  props: {
    data: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    sortedData() {
      // Create a copy of the data array using slice() and then sort the copy
      return this.data
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    },
  },

  data() {
    return {
      isLoading: true,
      datetime: "",
      APIResult: {},
      latestDebit: { debit: 0, prediction: 0 },
      previousDebit: null,
      diameter: null,
      velocity: 0,
      chartOptions: {
        chart: { type: "radialBar", offsetY: -30 },
        plotOptions: {
          radialBar: {
            startAngle: -180,
            endAngle: 180,
            hollow: { margin: 0, size: "70%" },
            track: { background: "#291523", strokeWidth: "67%", margin: 0 },
            dataLabels: {
              show: true,
              name: {
                offsetY: -15,
                show: true,
                color: "#888",
                fontSize: "17px",
              },
              value: {
                offsetY: 0,
                color: "#111",
                fontSize: "36px",
                show: true,
                formatter: function (val) {
                  return val;
                },
              },
            },
          },
        },
        colors: ["#1E90FF"],
        labels: [""],
        title: { text: "", align: "center" },
      },
      chartSeries: [67],
      lineChartOptions: {
        chart: {
          type: "line",
          height: "350",
          zoom: { type: "x", enabled: true, autoScaleYaxis: true },
          toolbar: { autoSelected: "zoom" },
        },
        xaxis: { type: "datetime" },
        yaxis: { title: { text: "Débit (L/s)" } },
      },
    };
  },

  computed: {
    lineChartSeries() {
      const transformedData = this.sortedData().map((entry) => ({
        x: entry.date || new Date(),
        y: entry.debit,
      }));
      return [{ name: "Débit", data: transformedData }];
    },
  },
  watch: {
    data(newVal) {
      console.log(newVal);
    },
  },
};
</script>
