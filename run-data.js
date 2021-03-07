const RunData = {
  process: (csv) => {
    const individual = [...csv];

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
          distance: 0,
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

    const sum = (acc, { distance }) => acc + distance;
    const cumulative = individual.map((obj, i) => ({
      ...obj,
      distance: individual.slice(0, i + 1).reduce(sum, 0),
    }));

    return {
      cumulative,
      individual,
    };
  },
};
