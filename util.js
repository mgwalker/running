export const chart = ({ id, tooltip, type = "bar", datasets }) => {
  const ctx = document.querySelector(`#${id} canvas`).getContext("2d");
  new Chart(ctx, {
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
        legend: { display: false },
        tooltip: tooltip
          ? {
              callbacks: {
                label: ({ dataIndex }) => tooltip.label(dataIndex),
                title: ([{ dataIndex }]) => tooltip.title(dataIndex),
              },
            }
          : { enabled: false },
      },
      responsive: true,
      scales: {
        x: {
          type: "time",
        },
        y: {
          min: 0,
        },
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
  const e = document.querySelector(selector);
  if (e) {
    e.innerText = txt;
  }
};
