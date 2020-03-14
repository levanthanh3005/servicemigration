#!/bin/bash
yum update -y
yum install git -y
yum install docker -y
yum install criu -y
git clone https://github.com/levanthanh3005/servicemigration
