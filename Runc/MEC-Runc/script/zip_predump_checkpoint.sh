#!/bin/bash
NAME=$1

tar xzvf /root/tmp/predump_$NAME.tar.gz -C .
tar xzvf /root/tmp/checkpoint_$NAME.tar.gz -C ./image/