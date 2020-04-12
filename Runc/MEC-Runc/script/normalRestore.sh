#!/bin/bash
NAME=$1

cd $HOME/containerroots/$NAME/image

tar xzvf /root/tmp/checkpoint_$NAME.tar.gz -C .

runc restore -d $NAME &> $HOME/logtmp/log.out < $HOME/logtmp/log.err
echo "Normal restore "+$NAME
runc list