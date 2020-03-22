#!/bin/bash
NAME=$1
SERVICERESUME=$2

cd $HOME/containerroots/$NAME/image

sleep 2
#criu lazy-pages --page-server --address 172.17.0.3 --port 27 -D checkpoint -vv
runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages $NAME
#runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages videoserver
curl localhost:$SERVICERESUME

#./lazyPageRestore.sh videoserver 172.17.0.3 5000/resume
