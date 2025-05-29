const csa = require('csa');
const { StopsConnection, BusLine } = require('../database');
const { Readable } = require('stream');


async function getNavigationPath(data) {
  const { departureStop, arrivalStop, departureTime } = data;


  const planner = new csa.BasicCSA({
    departureStop: departureStop,
    arrivalStop: arrivalStop,
    departureTime: departureTime
  });


  const connections = await StopsConnection.find();
  const conns = [];


  for (const connection of connections) {
    for (const line of connection.lines) {
      const dir = await BusLine.findOne(
        { _id: line.lineId, "directions._id": line.directionId },
        { "directions.$": 1 }
      ).lean();
      if (!dir || !dir.directions || !dir.directions[0]) continue;


      let departureIndex = dir.directions[0].stops?.findIndex(
        stop => stop?.stopId?.toString() === connection.from.toString()
      );
      if (departureIndex === -1 || departureIndex == null) continue;


      for (const time of dir.directions[0].timetable || []) {

        if (!time[departureIndex] || !time[departureIndex + 1]) continue;
        const departureTime = new Date();
        departureTime.setHours(time[departureIndex].hour, time[departureIndex].minute, 1, 0);
        const arrivalTime = new Date();
        arrivalTime.setHours(time[departureIndex + 1].hour, time[departureIndex + 1].minute, 0, 0);
        conns.push({
          '@id': connection._id.toString(),
          lineid: line.lineId.toString(),
          directionId: line.directionId.toString(),
          departureStop: connection.from.toString(),
          departureTime: departureTime,
          arrivalStop: connection.to.toString(),
          arrivalTime: arrivalTime,
        });
      }
    }
  }

  console.log("Partenza:", departureStop, "Arrivo:", arrivalStop);

  conns.sort((a, b) => a.departureTime - b.departureTime);

  if (conns.length === 0) {
      return Promise.resolve([]);
  }
  console.log(departureStop, arrivalStop, departureTime);

  return new Promise((resolve, reject) => {
    const connectionsReadStream = Readable.from(conns);
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.error("Planner timeout: nessun evento emesso");
        resolve([]);
        connectionsReadStream.destroy();
      }
    }, 500);

    connectionsReadStream.pipe(planner);

    planner.on("result", function (result) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        console.log("Planner result event");
        resolve(result);
        connectionsReadStream.destroy();
      }
    });

    planner.on("error", function (error) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        console.error("Planner error event:", error);
        reject(error);
        connectionsReadStream.destroy();
      }
    });

    planner.on("end", function () {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        console.log("Planner end event");
        resolve([]);
        connectionsReadStream.destroy();
      }
    });
  })
}

module.exports = { getNavigationPath };
