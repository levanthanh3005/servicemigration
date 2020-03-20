#!/bin/bash
NAME=$1
SOURCEADDRESS=$2

cd $HOME/containerroots/$NAME/image/checkpoint

$(criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -vv)

cd $HOME/containerroots/$NAME/image

runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages videoserver