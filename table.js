import { s, twoDecimalsFormatter } from "./run-data.js";

export default (data,units) => {
  const months = new Map();

  data.forEach((run) => {
    if (run.distance > 0) {
      const month = luxon.DateTime.fromISO(run.date).toFormat("MMMM");
      if (!months.get(month)) {
        months.set(month, []);
      }

      const monthData = months.get(month);

      monthData.push(run);
    }
  });

  const rows = [];
  const table = document.querySelector("#monthly-stats table");

  months.forEach((monthData, month) => {
    const count = monthData.filter(({ distance }) => distance > 0).length;

    const reduced = monthData.reduce(
      (acc, { distance, time }) => ({
        distance: acc.distance + distance,
        time: acc.time + luxon.Duration.fromISOTime(time),
      }),
      { distance: 0, time: 0 }
    );

    const averageDistance = reduced.distance / count;

    rows.push(`
      <th>${month}</th>
      <td>${count}</td>
      <td>${twoDecimalsFormatter(reduced.distance)} ${units}</td>
      <td>${twoDecimalsFormatter(averageDistance)} ${units}</td>
      <td>${luxon.Duration.fromMillis(reduced.time).toFormat("hh:mm:ss")}</td>
      <td>${luxon.Duration.fromMillis(reduced.time / reduced.distance).toFormat(
        "mm:ss"
      )} per ${units}</td>
`);
  });

  table.innerHTML = `
  <thead>
    <tr>
      <th>Month</th>
      <th>Runs</th>
      <th>Total distance</th>
      <th>Average distance</th>
      <th>Total duration</th>
      <th>Average pace</th>
  </thead>
   <tbody>${rows.map((row) => `<tr>${row}</tr>`).join("")}</tbody>`;
};
