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

const root =
  "https://gist.githubusercontent.com/mgwalker/de505c85d9225b3a379d2b3bc9342486/raw/";

const lastYear = 2020;
const thisYear = 2021;

const urls = {
  lastYear: `${root}2020.csv`,
  thisYear: `${root}2021.csv`,
};

const main = async () => {
  const csvThisYear = await csv(urls.thisYear);
  const csvLastYear = (await csv(urls.lastYear)).map((row) => ({
    ...row,
    date: row.date.replace(new RegExp(`^${lastYear}-`, "i"), `${thisYear}-`),
  }));

  fillHoles(csvThisYear);
  fillHoles(csvLastYear);

  const individual = getIndividual(csvThisYear);
  const pace = getPace(csvThisYear);
  const stats = getStats(csvThisYear);

  let fromDate = luxon.DateTime.fromISO(csvThisYear[0].date);
  let toDate = luxon.DateTime.fromISO(csvLastYear[0].date);
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
  toDate = luxon.DateTime.fromISO(csvLastYear.slice(-1)[0].date);
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

  chart({
    id: "individual",
    datasets: [
      {
        backgroundColor: "steelblue",
        borderColor: "steelblue",
        data: individual,
        label: "distance (miles)",
        type: "bar",
      },
      {
        backgroundColor: "orange",
        borderColor: "orange",
        data: pace,
        label: "pace (minutes per mile)",
        type: "bubble",
      },
    ],
    scales: { y: { display: false } },
    tooltip: {
      label({ datasetIndex: ds, dataIndex: index }) {
        return ds === 0
          ? ` ${individual[index].value} miles (${formatPace(
              pace[index].value
            )} per mile)`
          : ` ${formatPace(pace[index].value)} per mile (${
              individual[index].value
            } miles)`;
      },
      title([{ dataIndex: index }]) {
        return individual[index].date;
      },
    },
  });

  chart({
    id: "cumulative",
    type: "line",
    datasets: [
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
      {
        data: cumulativeLastYear,
        backgroundColor: "rgba(74,4,0,0.3)",
        borderColor: "#4A 04 00",
        borderWidth: 2,
        fill: "start",
        label: lastYear,
        pointHitRadius: 3,
        pointRadius: 0,
      },
    ],
    scales: { y: { min: 0, position: "right" } },
    tooltip: {
      label({ datasetIndex: ds, dataIndex: index }) {
        return ds === 0
          ? `${twoDecimalsFormatter(
              cumulativeThisYear[index].value
            )} miles (${twoDecimalsFormatter(
              cumulativeLastYear[index].value
            )} miles in ${lastYear})`
          : `${twoDecimalsFormatter(
              cumulativeLastYear[index].value
            )} miles (${twoDecimalsFormatter(
              cumulativeThisYear[index].value
            )} miles in ${thisYear})`;
      },
      title([{ dataIndex: index }]) {
        return cumulativeThisYear[index].date;
      },
    },
  });

  text("#stats-total-distance", `${stats.total} miles`);
  text("#stats-total-runs", `${stats.totalRuns}`);
  text("#stats-total-time", `${stats.totalTime}`);
  text("#stats-average-distance", `${stats.averageDistance} miles`);
  text("#stats-average-pace", `${stats.averagePace}`);

  return;
};

main();
