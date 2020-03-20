#!/bin/bash
NAME=$1

cd $HOME/containerroots
cd $NAME
cd image

runc checkpoint $NAME