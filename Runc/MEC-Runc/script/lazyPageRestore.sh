#!/bin/bash
NAME=$1
FILENAME=$2
SERVICERESUME=$3
SOURCEADDRESS=$4

pkill runc
pkill criu

########
startTime=$(($(date +%s%N)/1000000))

cd $HOME/containerroots/$NAME/image

echo "Unzip file"

tar xzvf /root/tmp/$FILENAME.tar.gz -C .

criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -D checkpoint -vv &> $HOME/logtmp/lazy-restore-log.out < $HOME/logtmp/lazy-restore-log.err

runc restore -d --work-path checkpoint --image-path checkpoint --lazy-pages $NAME &> $HOME/logtmp/log.out < $HOME/logtmp/log.err
curl localhost:$SERVICERESUME
endTime=$(($(date +%s%N)/1000000))
echo "Spent:"
expr $endTime - $startTime
echo "End:",$endTime," Start:",$startTime