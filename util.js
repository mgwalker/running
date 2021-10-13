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
    .then(({ data }) => data);

export const text = (selector, txt) => {
  const e = document.querySelectorAll(selector);
  if (e) {
    Array.from(e).forEach((ee) => {
      ee.innerText = txt;
    });
  }
};
