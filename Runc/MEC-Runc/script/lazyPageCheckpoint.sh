#!/bin/bash
NAME=$1
SERVICEPAUSE=$2

cd $HOME/containerroots/$NAME/image

runc checkpoint --pre-dump --image-path ../predump $NAME

curl localhost:$SERVICEPAUSE
runc checkpoint --parent-path ../predump --lazy-pages --page-server localhost:27 $NAME

#./lazyPageCheckpoint.sh videoserver 5000/resume

#runc checkpoint --pre-dump --image-path ../predump videoserver
#runc checkpoint --parent-path ../predump --lazy-pages --tcp-established --page-server localhost:2727 videoserver

# 10.7.20.89
# cd /home/academic/vanle/containerroots/videoserver/image/ && scp config.json vanle@10.7.20.104:/home/academic/vanle/containerroots/videoserver/image
# cd /home/academic/vanle/containerroots/videoserver/ && tar -zcvf /tmp/predump.tar.gz predump
# scp -r /tmp/predump.tar.gz vanle@10.7.20.104:/tmp
#####After checkpoint
# cd /home/academic/vanle/containerroots/videoserver/image/ && tar -zcvf /tmp/checkpoint.tar.gz checkpoint
# scp -r /tmp/checkpoint.tar.gz vanle@10.7.20.104:/tmp/

# 10.7.20.104
# tar xzvf /tmp/predump.tar.gz -C /home/academic/vanle/containerroots/videoserver/
# tar xzvf /tmp/checkpoint.tar.gz -C /home/academic/vanle/containerroots/videoserver/image/


#in case of copy all
# 10.7.20.89
# cd /home/academic/vanle/containerroots/ && tar -zcvf /tmp/videoserver.tar.gz videoserver
# scp -r /tmp/videoserver.tar.gz vanle@10.7.20.104:/tmp/
# 10.7.20.104
# tar xzvf /tmp/videoserver.tar.gz -C /home/academic/vanle/containerroots/videoserver/
# tar xzvf /tmp/videoserver.tar.gz -C /home/academic/vanle/containerroots/videoserver2/