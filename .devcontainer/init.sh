#!/bin/bash
containerWorkspaceFolder="$1"
npm install --prefix ${containerWorkspaceFolder}/api
npm install --prefix ${containerWorkspaceFolder}/frontend