#!/bin/bash
CONTAINERNAME=$1
NAME=$2

cd $HOME/containerroots
mkdir $NAME
cd $NAME

mkdir image
mkdir predump
cd image
mkdir rootfs

docker export $(docker create $CONTAINERNAME) | tar -C rootfs -xvf -
#docker export $(docker create levanthanh3005/nodecasting:countdown) | tar -C rootfs -xvf -
