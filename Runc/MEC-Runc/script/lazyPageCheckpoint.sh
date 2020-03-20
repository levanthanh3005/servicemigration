#!/bin/bash
NAME=$1
runc checkpoint --parent-path ../predump --lazy-pages --page-server localhost:27 $NAME
