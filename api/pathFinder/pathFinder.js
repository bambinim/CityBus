const csa = require('csa');
const { StopsConnection, BusLine } = require('../database');
const { Readable } = require('stream');
const { coordinatesDistance } = require('../lib/utils');
const { default: mongoose } = require('mongoose');


async function getNavigationPath(data) {
  const { departureStop, arrivalStop, departureCoords, arrivalCoords, departureTime } = data;


  const planner = new csa.BasicCSA({
    departureStop: 'departureLocation',
    arrivalStop: 'arrivalLocation',
    departureTime: departureTime
  });

  const conns = [];
  let footConnNum = 0

  const departureStopArrivalTime = getArrivalTime(departureCoords, departureStop.location.coordinates, departureTime)
  const connections = await StopsConnection.find();
  
  conns.push({
    '@id': 'footDeparture',
    travelMode: 'foot',
    departureStop: 'departureLocation',
    departureTime: departureTime,
    arrivalStop: departureStop._id.toString(),
    arrivalTime: departureStopArrivalTime
        
  })

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
        if(connection.to.toString() === arrivalStop._id.toString()){
          const arrivalLocationArrivalTime = getArrivalTime(arrivalCoords, arrivalStop.location.coordinates, arrivalTime)
          conns.push({
            '@id': 'footArrival' + footConnNum,
            travelMode: 'foot',
            departureStop: connection.to.toString(),
            departureTime: arrivalTime,
            arrivalStop: 'arrivalLocation',
            arrivalTime: arrivalLocationArrivalTime
          })
          footConnNum += 1
        }
        conns.push({
          '@id': connection._id.toString(),
          travelMode: 'bus',
          lineId: line.lineId.toString(),
          directionId: line.directionId.toString(),
          departureStop: connection.from.toString(),
          departureTime: departureTime,
          arrivalStop: connection.to.toString(),
          arrivalTime: arrivalTime,
        });
      }
    }
  }

  conns.sort((a, b) => a.departureTime - b.departureTime);
  return new Promise((resolve, reject) => {
    const connectionsReadStream = Readable.from(conns);
    let settled = false;

    connectionsReadStream.pipe(planner);

    planner.on("result", function (path) {
      if (!settled) {
        settled = true;
        resolve(path || []);
      }
    });

    planner.on("stop_condition", function (count) {
      if (!settled) {
        console.error("Reached stop condition after relaxing " + count + " connections.");
        settled = true;
        resolve([]);
      }
    });

    planner.on("end", function () {
      if (!settled) {
        console.error("End of stream reached (no path found)");
        settled = true;
        resolve([]);
      }
    });

    planner.on("data", function (mstConnection) {
      
    });

    planner.on("error", function (err) {
      if (!settled) {
        settled = true;
        console.error("Errore del planner:", err);
        reject(err);
      }
    });

  })
  
}

function getArrivalTime(departureCoords, arrivalCoords, departureTime){

  const distance = coordinatesDistance(departureCoords[1], departureCoords[0], arrivalCoords[1], arrivalCoords[0], "K")

  const timeHours = distance / 5

  const travelMs = timeHours * 60 * 60 * 1000

  const arrivalTime = new Date(departureTime.getTime() + travelMs)

  return arrivalTime
}

module.exports = { getNavigationPath };