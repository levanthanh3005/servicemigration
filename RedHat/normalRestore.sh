#!/bin/bash
NAME=$1

cd $HOME/containerroots
cd $NAME
cd image

runc restore -d $NAME
echo "Normal restore "+$NAME
runc list