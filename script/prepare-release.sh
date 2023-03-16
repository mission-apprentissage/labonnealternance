#!/bin/sh

next_version="${1}"

npm version ${next_version}
cd ./ui
npm version ${next_version}
cd ../ui_espace_pro
npm version ${next_version}
cd ../server
npm version ${next_version}