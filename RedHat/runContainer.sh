#!/bin/bash
CONTAINERNAME=$1
NAME=$2
CONFIG=$3

cd $HOME/containerroots
mkdir $NAME
cd $NAME

mkdir image
mkdir predump
cd image
mkdir rootfs

# docker export $(docker create levanthanh3005/nodecasting:v0.2.countdown.server) | tar -C rootfs -xvf -
docker export $(docker create $CONTAINERNAME) | tar -C rootfs -xvf -

cp $CONFIG $HOME/containerroots/$NAME/image/config.json

runc run -d $NAME &> /dev/null < /dev/null

runc list

echo "Run container done"
