#!/bin/bash
NAME=$1

cd $HOME/containerroots/$NAME
rm -rf predump
cd $HOME/containerroots/$NAME/image
rm -rf checkpoint

runc delete $NAME -f