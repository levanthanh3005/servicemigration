#!/bin/bash
CONTAINERNAME=$1
NAME=$2

cd $HOME/containerroots
[ ! -d $NAME ] && mkdir $NAME
cd $NAME

[ ! -d image ] && mkdir image
[ ! -d predump ] && mkdir predump
cd image
[ ! -d rootfs ] && mkdir rootfs

docker export $(docker create $CONTAINERNAME) | tar -C rootfs -xvf - > /dev/null 2>&1
#docker export $(docker create levanthanh3005/nodecasting:countdown) | tar -C rootfs -xvf -

#[ ! -d $HOME/tmp/ ] && mkdir $HOME/tmp/