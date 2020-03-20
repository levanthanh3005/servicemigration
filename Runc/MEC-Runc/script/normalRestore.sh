#!/bin/bash
NAME=$1

cd $HOME/containerroots/$NAME/image && runc restore -d $NAME
echo "Normal restore "+$NAME
runc list