const round = new Intl.NumberFormat("en-US", {
  maximumFrationDigits: 0,
  minimumIntegerDigits: 1,
}).format;

const secondsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumIntegerDigits: 2,
}).format;

export const twoDecimalsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
}).format;

const s = (count) => (count === 1 ? "" : "s");

export const formatPace = (sec) => {
  const [minutes, minPartial] = `${sec}`.split(".");
  const seconds = `0.${minPartial}` * 60;
  return `${minutes}:${secondsFormatter(seconds)}`;
};

const formatTime = (secs) => {
  const [hours, hourPartial] = `${secs / 3600}`.split(".");
  const [minutes, minPartial] = `${`0.${hourPartial}` * 60}`.split(".");
  const seconds = `0.${minPartial}` * 60;
  return `${round(hours)} hour${s(hours)}, ${round(minutes)} minute${s(
    minutes
  )}, and ${round(seconds)} second${s(seconds)}`;
};

const sum =
  (key = "distance") =>
  (acc, o) =>
    acc + o[key];

export const fillHoles = (points) => {
  const start = luxon.DateTime.fromISO(points[0].date);
  const end = luxon.DateTime.fromISO(points.slice(-1)[0].date);

  let date = start;
  let dataIndex = 0;

  const zeroObject = Object.keys(points[0]).reduce(
    (o, k) => ({ ...o, [k]: 0 }),
    {}
  );

  while (!date.equals(end)) {
    if (points[dataIndex]?.date !== date.toISODate()) {
      points.splice(dataIndex, 0, {
        ...zeroObject,
        date: date.toISODate(),
      });
    }
    date = date.plus({ days: 1 });
    dataIndex += 1;
  }
};

export const getCumulative = (data) =>
  data.map(({ distance, ...rest }, i) => ({
    ...rest,
    value: data.slice(0, i + 1).reduce(sum(), 0),
  }));

export const getIndividual = (data) =>
  data.map(({ date, distance }) => ({
    date,
    value: distance,
  }));

export const getPace = (data) =>
  data.map(({ date, distance, time }) => ({
    date,
    value: twoDecimalsFormatter(time / distance / 60),
  }));

export const getStats = (data) => {
  const nonzero = data.filter(({ distance }) => distance && distance > 0);
  const stats = {
    total: nonzero.reduce(sum(), 0),
    totalRuns: nonzero.length,
    totalTime: nonzero.reduce(sum("time"), 0),
  };

  stats.averageDistance = twoDecimalsFormatter(stats.total / stats.totalRuns);

  stats.averagePace = formatPace(stats.totalTime / stats.total / 60);
  stats.totalTime = formatTime(stats.totalTime);

  return stats;
};
