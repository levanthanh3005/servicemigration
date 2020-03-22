#!/bin/bash
NAME=$1

cd $HOME/containerroots
cd $NAME
cd image

echo "start predump"
runc checkpoint --pre-dump --image-path ../predump $NAME

echo "done predump"

runc checkpoint --parent-path ../predump $NAME
#runc checkpoint --pre-dump --image-path ../predump videoserver

echo "done"