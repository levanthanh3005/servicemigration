#!/bin/bash
NAME=$1
SOURCEADDRESS=$2
SERVICERESUME=$3

cd $HOME/containerroots/$NAME/
chmod -R 777 *

cd $HOME/containerroots/$NAME/image

#criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -D checkpoint -vv </dev/null &>/dev/null &
$(criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -D checkpoint &) &

#sleep 3
#criu lazy-pages --page-server --address 172.17.0.3 --port 27 -D checkpoint -vv
runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages $NAME
#runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages videoserver
curl localhost:$SERVICERESUME

#./lazyPageRestore.sh videoserver 172.17.0.3 5000/resume
