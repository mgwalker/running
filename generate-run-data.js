const fs = require("fs").promises;

const base = "apple_health_export/workout-routes";

const main = async () => {
  const files = await fs.readdir(base);

  const workouts = {};

  files.forEach((file) => {
    if (file.endsWith(".gpx")) {
      const [, date] = file.match(/^route_(\d{4}-\d{2}-\d{2})_.*\.gpx$/);
      if (!workouts[date]) {
        workouts[date] = [];
      }
      workouts[date].push(file);
    }
  });
  console.log(workouts);
};

main();
