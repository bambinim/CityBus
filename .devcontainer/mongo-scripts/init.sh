#!/bin/bash
mongosh -u ${MONGODB_ROOT_USER} -p ${MONGODB_ROOT_PASSWORD} << EOF
    use citybus
    db.createCollection('delete_me')
EOF
