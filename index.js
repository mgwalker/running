import { chart, csv, text } from "./util.js";
import {
  fillHoles,
  formatPace,
  getCumulative,
  getIndividual,
  getPace,
  getStats,
  twoDecimalsFormatter,
} from "./run-data.js";
import populateTable from "./table.js";

const CONVERSIONS = new Map([["kilometers", 1.609344]]);
const UNITS = new Map([
  ["miles", "miles"],
  ["kilometers", "km"],
]);

const root =
  "https://gist.githubusercontent.com/mgwalker/de505c85d9225b3a379d2b3bc9342486/raw/";

const charts = [];

const main = async (unit = "miles") => {
  const scale = CONVERSIONS.get(unit) ?? 1;
  const units = UNITS.get(unit) ?? "miles";

  const hashConfig = window.location.hash
    .replace(/^#/, "")
    .split(";")
    .map((v) => v.split("="))
    .reduce((ob, [key, value]) => ({ ...ob, [key]: value }), {});

  const thisYear = hashConfig.year ?? `{new Date().getFullYear()}`;
  const lastYear = thisYear - 1;
  const hasLastYear = lastYear > 2018;

  text("title", `My runs, ${thisYear}`);
  text(".year", thisYear);

  const urls = {
    lastYear: `${root}${lastYear}.csv?${Math.random()}`,
    thisYear: `${root}${thisYear}.csv?${Math.random()}`,
  };

  const csvThisYear = (await csv(urls.thisYear)).map((row) => ({
    ...row,
    distance: row.distance * scale,
  }));
  const csvLastYear = hasLastYear
    ? (await csv(urls.lastYear)).map((row) => ({
        ...row,
        date: row.date.replace(
          new RegExp(`^${lastYear}-`, "i"),
          `${thisYear}-`
        ),
        distance: row.distance * scale,
      }))
    : [];

  fillHoles(csvThisYear);
  if (hasLastYear) {
    fillHoles(csvLastYear);
  }

  const individual = getIndividual(csvThisYear);
  const pace = getPace(csvThisYear);
  const stats = getStats(csvThisYear);

  let fromDate = luxon.DateTime.fromISO(csvThisYear[0].date);
  let toDate = hasLastYear
    ? luxon.DateTime.fromISO(csvLastYear[0].date)
    : fromDate;
  let dataSetToExtend = csvLastYear;
  if (fromDate > toDate) {
    fromDate = luxon.DateTime.fromISO(csvLastYear[0].date);
    toDate = luxon.DateTime.fromISO(csvThisYear[0].date);
    dataSetToExtend = csvThisYear;
  }

  while (toDate > fromDate) {
    toDate = toDate.minus({ days: 1 });
    dataSetToExtend.unshift({
      date: toDate.toISODate(),
      distance: 0,
      time: 0,
    });
  }

  fromDate = luxon.DateTime.fromISO(csvThisYear.slice(-1)[0].date);
  toDate = hasLastYear
    ? luxon.DateTime.fromISO(csvLastYear.slice(-1)[0].date)
    : fromDate;
  dataSetToExtend = csvThisYear;

  if (fromDate > toDate) {
    fromDate = luxon.DateTime.fromISO(csvLastYear.slice(-1)[0].date);
    toDate = luxon.DateTime.fromISO(csvThisYear.slice(-1)[0].date);
    dataSetToExtend = csvLastYear;
  }

  while (fromDate < toDate) {
    fromDate = fromDate.plus({ days: 1 });
    dataSetToExtend.push({
      date: fromDate.toISODate(),
      distance: 0,
      time: 0,
    });
  }

  const cumulativeThisYear = getCumulative(csvThisYear);
  const cumulativeLastYear = getCumulative(csvLastYear);

  const actualRuns = csvThisYear.filter(({ distance }) => distance > 0);
  let actualRunNumber = 0;
  let totalTimeCumulative = 0;

  const avgPace = pace.map(({ date }, i) => {
    if (pace[i].value !== null) {
      const { value: cumulative } = cumulativeThisYear.find(
        ({ date: cDate }) => cDate === date
      );

      const avgPace = {
        date,
        value: luxon.Duration.fromMillis(
          (totalTimeCumulative += luxon.Duration.fromISOTime(
            actualRuns[actualRunNumber].time
          )) / cumulative
        ),
      };

      actualRunNumber += 1;

      return avgPace;
    }
    return { date, value: null };
  }, 0);

  actualRunNumber = 0;

  const avgDistance = individual.map(({ date, value }, i) => {
    if (value) {
      actualRunNumber += 1;
      return {
        date,
        value: twoDecimalsFormatter(
          cumulativeThisYear[i].value / actualRunNumber
        ),
      };
    }
    return { date, value: null };
  }, 0);

  const cumulativeDatasets = [
    {
      data: cumulativeThisYear,
      backgroundColor: "rgba(55,124,34,0.3)",
      borderColor: "#377D22",
      borderWidth: 2,
      fill: "start",
      label: thisYear,
      pointHitRadius: 3,
      pointRadius: 0,
    },
  ];

  if(thisYear === new Date().getFullYear()) {
    fromDate = luxon.DateTime.fromISO(`${thisYear}-01-01`);
    toDate = hasLastYear
      ? luxon.DateTime.fromISO(csvLastYear.slice(-1)[0].date)
      : fromDate;

    const projected = {
      data: [],
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "blue",
      borderWidth: 2,
      borderDash: [5, 10],
      pointHitRadius: 3,
      pointRadius: 0,
      label: `projected (${thisYear})`,
    };

    let projectedTotal = +stats.milesPerDay;
    while (fromDate <= toDate) {
      projected.data.push({ date: fromDate.toISODate(), value: projectedTotal });

      fromDate = fromDate.plus({ days: 1 });
      projectedTotal += +stats.milesPerDay;
    }
    cumulativeDatasets.push(projected);
  }

  const tooltip = {
    label({ datasetIndex: ds, dataIndex: index }) {
      if (ds === 0) {
        return `${twoDecimalsFormatter(
          cumulativeThisYear[index].value
        )} ${units}`;
      } else if (ds === 1) {
        return twoDecimalsFormatter(cumulativeDatasets[ds].data[index].value);
      }
    },
    title([{ dataIndex: index }]) {
      return cumulativeThisYear[index].date;
    },
  };

  if (hasLastYear) {
    cumulativeDatasets.push({
      data: cumulativeLastYear,
      backgroundColor: "rgba(74,4,0,0.3)",
      borderColor: "#4A 04 00",
      borderWidth: 2,
      fill: "start",
      label: lastYear,
      pointHitRadius: 3,
      pointRadius: 0,
    });

    tooltip.label = ({ datasetIndex: ds, dataIndex: index }) => {
      if (ds === 0) {
        return `${twoDecimalsFormatter(
          cumulativeThisYear[index].value
        )} ${units} (${twoDecimalsFormatter(
          cumulativeLastYear[index].value
        )} ${units} in ${lastYear})`;
      } else if (ds === 1) {
        return twoDecimalsFormatter(cumulativeDatasets[ds].data[index].value);
      } else if (ds === 2) {
        return `${twoDecimalsFormatter(
          cumulativeLastYear[index].value
        )} ${units} (${twoDecimalsFormatter(
          cumulativeThisYear[index].value
        )} ${units} in ${thisYear})`;
      }
    };
  }

  charts.forEach((c) => {
    c.destroy();
  });
  charts.length = 0;

  charts.push(
    chart({
      id: "cumulative",
      type: "line",
      datasets: cumulativeDatasets,
      scales: { y: { min: 0, position: "right" } },
      tooltip,
    })
  );

  charts.push(
    chart({
      id: "individual",
      datasets: [
        {
          backgroundColor: "steelblue",
          borderColor: "steelblue",
          data: individual,
          label: `distance (${units})`,
          type: "bar",
        },
        {
          backgroundColor: "orange",
          borderColor: "orange",
          data: pace.map(({ date, value }) => ({
            date,
            value: value?.as("minutes"),
          })),
          label: `pace (minutes per ${units})`,
          type: "bubble",
        },
        {
          backgroundColor: "saddlebrown",
          borderColor: "saddlebrown",
          data: avgPace.map(({ date, value }) => ({
            date,
            value: value?.as("minutes"),
          })),
          label: `average pace (minutes per ${units})`,
          spanGaps: true,
          type: "line",
        },
        {
          backgroundColor: "darkblue",
          borderColor: "darkblue",
          data: avgDistance,
          label: `average distance per run (${units})`,
          spanGaps: true,
          type: "line",
        },
      ],
      scales: { y: { display: false } },
      tooltip: {
        label({ datasetIndex: ds, dataIndex: index }) {
          switch (ds) {
            case 0:
              return ` ${individual[index].value} ${units} (${formatPace(
                pace[index].value
              )} per ${units})`;
            case 1:
              return ` ${formatPace(pace[index].value)} per ${units} (${
                individual[index].value
              } ${units})`;
            case 2:
              return ` average ${formatPace(
                avgPace[index].value
              )} per ${units}`;
            case 3:
              return ` average ${avgDistance[index].value} ${units} per run`;
          }
        },
        title([{ dataIndex: index }]) {
          return individual[index].date;
        },
      },
    })
  );

  text("#stats-total-distance", `${stats.total} ${units}`);
  text("#stats-total-runs", `${stats.totalRuns}`);
  text("#stats-total-time", `${stats.totalTime}`);
  text("#stats-average-distance", `${stats.averageDistance} ${units}`);
  text("#stats-average-pace", `${stats.averagePace}`);
  text("#stats-miles-per-day", `${stats.milesPerDay} ${units}`);

  populateTable(csvThisYear, units);

  return;
};

main();
window.addEventListener("hashchange", () => {
  main();
});

document.getElementById("units").addEventListener("change", () => {
  main(document.getElementById("units").value);
});
