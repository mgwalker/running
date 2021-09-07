import { chart, csv, text } from "./util.js";
import {
  fillHoles,
  getCumulative,
  getIndividual,
  getPace,
  getStats,
} from "./run-data.js";

const twoDecimalsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const root =
  "https://gist.githubusercontent.com/mgwalker/de505c85d9225b3a379d2b3bc9342486/raw/";

const urls = {
  y2020: `${root}2020.csv`,
  y2021: `${root}2021.csv`,
};

const main = async () => {
  const csv2021 = await csv(urls.y2021);
  const csv2020 = (await csv(urls.y2020)).map((row) => ({
    ...row,
    date: row.date.replace(/^2020-/, "2021-"),
  }));

  fillHoles(csv2021);
  fillHoles(csv2020);

  const i2021 = getIndividual(csv2021);
  const p2021 = getPace(csv2021);

  const s2021 = getStats(csv2021);

  let fromDate = luxon.DateTime.fromISO(csv2021[0].date);
  let toDate = luxon.DateTime.fromISO(csv2020[0].date);
  let dataSetToExtend = csv2020;
  if (fromDate > toDate) {
    fromDate = luxon.DateTime.fromISO(csv2020[0].date);
    toDate = luxon.DateTime.fromISO(csv2021[0].date);
    dataSetToExtend = csv2021;
  }

  while (toDate > fromDate) {
    toDate = toDate.minus({ days: 1 });
    dataSetToExtend.unshift({
      date: toDate.toISODate(),
      distance: 0,
      time: 0,
    });
  }

  fromDate = luxon.DateTime.fromISO(csv2021.slice(-1)[0].date);
  toDate = luxon.DateTime.fromISO(csv2020.slice(-1)[0].date);
  dataSetToExtend = csv2021;

  if (fromDate > toDate) {
    fromDate = luxon.DateTime.fromISO(csv2020.slice(-1)[0].date);
    toDate = luxon.DateTime.fromISO(csv2021.slice(-1)[0].date);
    dataSetToExtend = csv2020;
  }

  while (fromDate < toDate) {
    fromDate = fromDate.plus({ days: 1 });
    dataSetToExtend.push({
      date: fromDate.toISODate(),
      distance: 0,
      time: 0,
    });
  }

  const c2021 = getCumulative(csv2021);
  const c2020 = getCumulative(csv2020);

  chart({
    id: "individual",
    datasets: [
      {
        backgroundColor: "steelblue",
        borderColor: "steelblue",
        borderWidth: 5,
        data: i2021,
      },
    ],
    tooltip: {
      label(index) {
        return ` ${i2021[index].value} miles`;
      },
      title(index) {
        return i2021[index].date;
      },
    },
  });

  chart({
    id: "cumulative",
    type: "line",
    datasets: [
      {
        data: c2021,
        backgroundColor: "rgba(55,124,34,0.3)",
        borderColor: "#377D22",
        borderWidth: 2,
        fill: "start",
        pointRadius: 0,
      },
      {
        data: c2020,
        backgroundColor: "rgba(74,4,0,0.3)",
        borderColor: "#4A 04 00",
        borderWidth: 2,
        fill: "start",
        pointRadius: 0,
      },
    ],
  });

  chart({
    id: "pace",
    datasets: [
      {
        backgroundColor: "orange",
        borderColor: "orange",
        borderWidth: 5,
        data: p2021,
      },
    ],
    tooltip: {
      label: (index) =>
        ` ${twoDecimalsFormatter.format(p2021[index].value)} minutes per mile`,
      title: (index) => p2021[index].date,
    },
  });

  text("#stats-total-distance", `${s2021.total} miles`);
  text("#stats-total-runs", `${s2021.totalRuns}`);
  text("#stats-total-time", `${s2021.totalTime}`);
  text("#stats-average-distance", `${s2021.averageDistance} miles per run`);
  text("#stats-average-pace", `${s2021.averagePace} per mile`);

  return;
};

main();
