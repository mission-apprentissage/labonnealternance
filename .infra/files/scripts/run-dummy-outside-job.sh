#!/usr/bin/env bash
set -euo pipefail

#################################################
# Script d'éxecution
#################################################

call_dummy_job(){
  # Something outside
  echo "dummy job outside said: Hello"
} 

call_dummy_job
