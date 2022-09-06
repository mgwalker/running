export const chart = ({ id, tooltip, type = "bar", datasets, scales }) => {
  const ctx = document.querySelector(`#${id} canvas`).getContext("2d");
  return new Chart(ctx, {
    type,
    data: {
      labels: datasets[0].data.map(({ date }) => date),
      datasets: datasets.map(({ data, tooltip, ...rest }) => ({
        data: data.map(({ value }) => value),
        ...rest,
      })),
    },
    options: {
      animation: false,
      plugins: {
        legend: { display: true, position: "top", align: "start" },
        tooltip: tooltip
          ? {
              callbacks: {
                label: tooltip.label,
                title: tooltip.title,
              },
            }
          : { enabled: false },
      },
      responsive: true,
      scales: {
        x: {
          type: "time",
        },
        ...(scales ?? { y: { min: 0 } }),
      },
    },
  });
};

export const csv = async (url) =>
  fetch(url)
    .then((r) => r.text())
    .then((t) =>
      t.split("\n").reduce((obj, row, i) => {
        if (i === 0) {
          return {
            headers: row.split(","),
            data: [],
          };
        }

        const data = row.split(",").reduce(
          (o, cell, i) => ({
            ...o,
            [obj.headers[i]]: Number.isNaN(Number(cell)) ? cell : +cell,
          }),
          {}
        );

        return { headers: obj.headers, data: [...obj.data, data] };
      }, {})
    )
    .then(({ data }) =>
      // If there are multiple entries on the same day, merge them together by
      // summing their distances and durations. This makes the graphing stuff
      // easier and doesn't affect the high-level summary stats.
      data
        .map((thisRun, i) => {
          // We need the indices of any other runs on the same date. We'll use
          // the index to update the other-run inline.
          const runsOnSameDayIndices = data
            .map((otherRun, fi) => {
              // Only check higher indices than this one, since this one will
              // become "canonical". If this otherRun is on the same date as
              // thisRun, return otherRun's index for the map.
              if (fi > i && otherRun.date === thisRun.date) {
                return fi;
              }
              // Otherwise, map to false. We'll use that to filter stuff out.
              return false;
            })
            .filter((v) => v !== false);

          for (const otherRun of runsOnSameDayIndices) {
            thisRun.distance += data[otherRun].distance;
            thisRun.time = luxon.Duration.fromISOTime(thisRun.time)
              .plus(luxon.Duration.fromISOTime(data[otherRun].time))
              .toFormat("hh:mm:ss");

            // Similar story as above, except instead of mapping thisRun to
            // false, we're directly setting the other run to false. This works
            // out okay because future iterations of the map will find
            // thisRun.date to be undefined, which doesn't match any other runs,
            // circumventing this loop, and returning the input. So it's safe.
            data[otherRun] = false;
          }

          // Return the (maybe modified) run object.
          return thisRun;
        })
        // Now get rid of the run entries that were merged upwards.
        .filter((v) => v !== false)
    );

export const text = (selector, txt) => {
  const e = document.querySelectorAll(selector);
  if (e) {
    Array.from(e).forEach((ee) => {
      ee.innerText = txt;
    });
  }
};
