#!/bin/bash
NAME=$1

cd $HOME/containerroots/$NAME/image

#runc run -d $NAME &> /dev/null < /dev/null
runc run -d $NAME &> $HOME/logtmp/log.out < $HOME/logtmp/log.err
#runc run -d videoserver &> /dev/null < /dev/null
runc list
echo "Run container done"
