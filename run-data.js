export const twoDecimalsFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
}).format;

const s = (count) => (+count === 1 ? "" : "s");

export const formatPace = (duration) =>
  duration === null ? "" : duration.toFormat("m:ss");

const formatTime = (secs) => {
  const [hours, minutes, seconds] = secs.toFormat("h:m:s").split(":");
  return `${hours} hour${s(hours)}, ${minutes} minute${s(
    minutes
  )}, and ${seconds} second${s(seconds)}`;
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
    value:
      distance === 0
        ? null
        : luxon.Duration.fromMillis(
            luxon.Duration.fromISOTime(time) / distance
          ),
  }));

export const getStats = (data) => {
  const nonzero = data.filter(({ distance }) => distance && distance > 0);
  const stats = {
    total: nonzero.reduce(sum(), 0),
    totalRuns: nonzero.length,
    totalTime: luxon.Duration.fromMillis(
      nonzero.reduce(
        (sum, { time }) => luxon.Duration.fromISOTime(time) + sum,
        0
      )
    ),
  };

  stats.averageDistance = twoDecimalsFormatter(stats.total / stats.totalRuns);

  stats.averagePace = formatPace(
    luxon.Duration.fromMillis(stats.totalTime / stats.total)
  );
  stats.totalTime = formatTime(stats.totalTime);

  return stats;
};
