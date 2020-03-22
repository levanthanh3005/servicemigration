#!/bin/bash
NAME=$2

cd $HOME/containerroots/$NAME
rm -rf predump
cd $HOME/containerroots/$NAME/image
rm -rf checkpoint