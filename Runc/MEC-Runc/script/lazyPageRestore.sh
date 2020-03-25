#!/bin/bash
NAME=$1
SERVICERESUME=$2
SOURCEADDRESS=$3

########
startTime=$(($(date +%s%N)/1000000))

cd $HOME/containerroots/$NAME/image

tar xzvf /root/tmp/checkpoint_$NAME.tar.gz -C .

criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -D checkpoint -vv </dev/null &>/dev/null &

runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages $NAME
curl localhost:$SERVICERESUME
endTime=$(($(date +%s%N)/1000000))
echo "Spent:"
expr $endTime - $startTime
echo "End:",$endTime," Start:",$startTime