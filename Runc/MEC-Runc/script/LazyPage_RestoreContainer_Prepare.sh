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

cd $HOME/containerroots/$NAME

tar xzvf /tmp/predump_$NAME.tar.gz -C .
tar xzvf /tmp/checkpoint_$NAME.tar.gz -C ./image/