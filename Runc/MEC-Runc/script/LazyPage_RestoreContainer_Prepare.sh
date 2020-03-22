#!/bin/bash
NAME=$2

cd $HOME/containerroots/$NAME

tar xzvf /tmp/predump_$NAME.tar.gz -C .
tar xzvf /tmp/checkpoint_$NAME.tar.gz -C ./image/