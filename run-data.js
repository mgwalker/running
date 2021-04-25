const RunData = {
  process: (csv) => {
    const individual = csv.map(({ date, distance, time }) => ({
      date,
      pace: time / distance / 60,
      value: distance,
    }));

    const start = individual[0].date;
    const end = individual[individual.length - 1].date.getTime();
    let dayNumber = start.getDate() + 1;
    let date = new Date(
      start.getFullYear(),
      start.getMonth(),
      dayNumber
    ).getTime();
    let dataIndex = 1;

    while (date !== end) {
      if (individual[dataIndex].date.getTime() !== date) {
        individual.splice(dataIndex, 0, {
          date: new Date(start.getFullYear(), start.getMonth(), dayNumber),
          value: 0,
          pace: 0,
        });
      }

      dayNumber += 1;
      date = new Date(
        start.getFullYear(),
        start.getMonth(),
        dayNumber
      ).getTime();
      dataIndex += 1;
    }

    const sum = (acc, { value }) => acc + value;
    const cumulative = individual.map((obj, i) => ({
      ...obj,
      value: individual.slice(0, i + 1).reduce(sum, 0),
    }));

    const pace = individual.map(({ date, pace }) => {
      if (pace > 0) {
        previousPace = pace;
      }

      return {
        date,
        value: pace,
      };
    });

    const twoDecimalsFormatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    });

    const stats = {
      averageDistance: individual
        .filter(({ value }) => value > 0)
        .map(({ value }) => value)
        .reduce((sum, distance, i, all) => {
          const newSum = sum + distance;
          if (i === all.length - 1) {
            return twoDecimalsFormatter.format(newSum / all.length);
          }
          return newSum;
        }, 0),

      averagePace: individual
        .filter(({ pace }) => pace > 0)
        .map(({ pace }) => pace)
        .reduce((sum, pace, i, all) => {
          const newSum = sum + pace;
          if (i === all.length - 1) {
            return newSum / all.length;
          }
          return newSum;
        }, 0),

      total: cumulative.slice(-1)[0].value,

      totalRuns: csv.length,

      totalTime: csv.reduce((sum, { time }) => sum + time, 0),
    };

    const secondsFormatter = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
      minimumIntegerDigits: 2,
    });

    {
      const [minutes, minPartial] = `${stats.averagePace}`.split(".");
      const seconds = `0.${minPartial}` * 60;
      stats.averagePace = `${minutes}:${secondsFormatter.format(seconds)}`;
    }

    {
      const [hours, hourPartial] = `${stats.totalTime / 3600}`.split(".");
      const [minutes, minPartial] = `${`0.${hourPartial}` * 60}`.split(".");
      const seconds = `0.${minPartial}` * 60;
      stats.totalTime = `${hours} hours, ${minutes} minutes, ${secondsFormatter.format(
        seconds
      )} seconds`;
    }

    return {
      cumulative,
      individual,
      pace,
      stats,
    };
  },
};
