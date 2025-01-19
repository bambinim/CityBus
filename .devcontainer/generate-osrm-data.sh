#!/bin/bash

BASE_DIR=$(realpath $(dirname $0))
OSM_DATA_DOWNLOAD_URL="https://download.geofabrik.de/europe/italy-latest.osm.pbf"
OSM_FILE_NAME=data.osm.pbf

mkdir -p "${BASE_DIR}/osm" "${BASE_DIR}/osrm/car" "${BASE_DIR}/osrm/foot"
if [[ ! -f "${BASE_DIR}/osm/${OSM_FILE_NAME}" ]] ; then
    echo "Downloading OpenStreetMap data for Italy..."
    curl  ${OSM_DATA_DOWNLOAD_URL} --output "${BASE_DIR}/osm/${OSM_FILE_NAME}"
fi

if [[ ! -f "${BASE_DIR}/osrm/car/data.osrm" ]] ; then
    echo "Generating osrm data for car routing..."
    docker run -i --rm \
        --user $(id -u):$(id -g) \
        --entrypoint /bin/bash \
        -v "${BASE_DIR}/osrm":/data/osrm \
        -v "${BASE_DIR}/osm":/data/osm \
        osrm/osrm-backend << EOF
        ln -s /data/osm/data.osm.pbf /data/osrm/car/data.osm.pbf && \
        osrm-extract -p /opt/car.lua /data/osrm/car/data.osm.pbf && \
        osrm-partition /data/osrm/car/data.osrm && \
        osrm-customize /data/osrm/car/data.osrm && \
        rm /data/osrm/car/data.osm.pbf
EOF
fi

if [[ ! -f "${BASE_DIR}/osrm/foot/data.osrm" ]] ; then
    echo "Generating osrm data for foot routing..."
    docker run -i --rm \
        --user $(id -u):$(id -g) \
        --entrypoint /bin/bash \
        -v "${BASE_DIR}/osrm":/data/osrm \
        -v "${BASE_DIR}/osm":/data/osm \
        osrm/osrm-backend << EOF
        ln -s /data/osm/data.osm.pbf /data/osrm/foot/data.osm.pbf && \
        osrm-extract -p /opt/foot.lua /data/osrm/foot/data.osm.pbf && \
        osrm-partition /data/osrm/foot/data.osrm && \
        osrm-customize /data/osrm/foot/data.osrm && \
        rm /data/osrm/foot/data.osm.pbf
EOF
fi
