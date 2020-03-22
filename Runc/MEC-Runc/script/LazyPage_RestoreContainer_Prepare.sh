#!/bin/bash
NAME=$1
SOURCEADDRESS=$2

cd $HOME/containerroots/$NAME/
chmod -R 777 *

tar xzvf /root/tmp/predump_$NAME.tar.gz -C .
tar xzvf /root/tmp/checkpoint_$NAME.tar.gz -C ./image/

cd $HOME/containerroots/$NAME/image

criu lazy-pages --page-server --address $SOURCEADDRESS --port 27 -D checkpoint -vv </dev/null &>/dev/null &