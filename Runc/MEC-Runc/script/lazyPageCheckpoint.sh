#!/bin/bash
NAME=$1
SERVICEPAUSE=$2

cd $HOME/containerroots/$NAME/image

runc checkpoint --pre-dump --image-path ../predump $NAME

curl localhost:$SERVICEPAUSE
echo "Lets copy"
runc checkpoint --parent-path ../predump --lazy-pages --page-server localhost:27 $NAME

########

startTime=$(($(date +%s%N)/1000000))
curl localhost:$SERVICEPAUSE
cd $HOME/containerroots/$NAME/image
runc checkpoint --parent-path ../predump --lazy-pages --status-fd /root/tmp/lazy-pipe --page-server localhost:27 videoserver </dev/null &>/dev/null &
#while [ ! -f "checkpoint/inventory.img" ]; do echo "wait until inventory exitst"; done
while [ $(cat /root/tmp/lazy-pipe) -eq "0" ]; do echo "wait lazy page ready"; done
#sleep 2
tar -zcvf /root/tmp/checkpoint_$NAME.tar.gz checkpoint
endTime=$(($(date +%s%N)/1000000))
echo "Spent:"
expr $endTime - $startTime
echo "End:",$endTime," Start:",$startTime