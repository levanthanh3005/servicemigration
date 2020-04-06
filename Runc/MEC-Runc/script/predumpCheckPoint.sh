#!/bin/bash
NAME=$1

cd $HOME/containerroots/$NAME/image

echo "start predump"
runc checkpoint --pre-dump --image-path ../predump $NAME
cd $HOME/containerroots/$NAME
tar -zcvf /root/tmp/predump_$NAME.tar.gz predump && echo "ZIP done"
echo '0' > /root/tmp/lazy-pipe