import "https://d3js.org/d3.v6.min.js";
import { graph } from "./graph.js";
import { process } from "./run-data.js";

const text = (selector, txt) => {
  const e = document.querySelector(selector);
  if (e) {
    e.innerText = txt;
  }
};

const root =
  "https://gist.githubusercontent.com/mgwalker/de505c85d9225b3a379d2b3bc9342486/raw/";

const urls = {
  y2020: `${root}2020.csv`,
  y2021: `${root}2021.csv`,
};

const main = async () => {
  const dateParser = d3.timeParse("%Y-%m-%d");

  const csv2021 = await d3.csv(urls.y2021, (c) => ({
    date: dateParser(c.date),
    distance: +c.distance,
    time: +c.time,
  }));

  const csv2020 = await d3.csv(urls.y2020, (c) => {
    const date = dateParser(c.date);
    date.setFullYear(2021);

    return {
      date,
      distance: +c.distance,
      time: +c.time,
    };
  });

  const {
    cumulative: c2021,
    individual: i2021,
    pace: p2021,
    stats: s2021,
  } = process(csv2021);

  // If the current year's runs started before last year's runs,
  // pad last year's data with zeroes at the start so the graph
  // works.
  while (csv2021[0].date < csv2020[0].date) {
    const date = new Date(csv2020[0].date);
    date.setDate(-1);
    csv2020.unshift({
      date,
      distance: 0,
      time: 0,
    });
  }

  // Likewise for the end.
  while (csv2021.slice(-1)[0].date > csv2020.slice(-1)[0].date) {
    const date = new Date(csv2020.slice(-1)[0].date);
    date.setDate(-1);
    csv2020.unshift({
      date,
      distance: 0,
      time: 0,
    });
  }

  const { cumulative: c2020 } = process(csv2020);

  const tooltip = document.getElementById("tooltip");
  const twoDecimalsFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  });

  graph(i2021, { yAxisLabel: "miles" })
    .addBar(null, {
      onMouseOut: () => {
        tooltip.style.visibility = "";
      },
      onMouseOver: ({ clientX, clientY }, { date, distance, pace }) => {
        tooltip.style.visibility = "visible";
        tooltip.style.top = `${clientY}px`;

        if (clientX > window.innerWidth * 0.8) {
          tooltip.style.left = "auto";
          tooltip.style.right = `${window.innerWidth - clientX}px`;
        } else {
          tooltip.style.left = `${clientX}px`;
          tooltip.style.right = "auto";
        }

        tooltip.innerHTML = `
  <h2>${date.toDateString()}</h2>
  ${distance} miles<br/>
  ${twoDecimalsFormatter.format(pace)} minutes/mile<br/>
  ${twoDecimalsFormatter.format(60 / pace)} mph`;
      },
    })
    .append("#individual");

  graph(c2020, { yAxisLabel: "miles" })
    .addBar(c2021, { fill: "#377D22" })
    .addBar(c2020, { fill: "#4A0400" })
    .append("#cumulative");

  graph(p2021, { yAxisLabel: "minutes per mile" })
    .addBar(null, { fill: "orange" })
    .append("#pace");

  text("#stats-total-distance", `${s2021.total} miles`);
  text("#stats-total-runs", `${s2021.totalRuns}`);
  text("#stats-total-time", `${s2021.totalTime}`);
  text("#stats-average-distance", `${s2021.averageDistance} miles per run`);
  text("#stats-average-pace", `${s2021.averagePace} per mile`);
};

main();
