#!/usr/bin/env bash

find /etc/nginx/certs -name key.pem -exec sh -c 'ln -sr $1 $(dirname $1)/privkey.pem' sh {} \;
find /etc/nginx/certs -type f -exec chmod +r {} \;
