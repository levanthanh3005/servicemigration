sudo -s
cd
apt install build-essential -y
apt install pkg-config -y
apt install libnet-dev python-yaml libaio-dev -y
apt install libprotobuf-dev libprotobuf-c0-dev protobuf-c-compiler protobuf-compiler python-protobuf libnl-3-dev libcap-dev python-future -y

# criu install
curl -O -sSL http://download.openvz.org/criu/criu-3.13.tar.bz2
tar xjf criu-3.13.tar.bz2
cd criu-3.13
make
cp ~/criu-3.13/criu/criu /usr/sbin/

criu --version

#runc latest

cd

apt install golang libseccomp-dev -y

export GOPATH=$HOME/go
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin

go get github.com/opencontainers/runc
cd $GOPATH/src/github.com/opencontainers/runc
make clean
make BUILDTAGS='seccomp apparmor'
sudo make install PREFIX=/usr/local

#----
mkdir -p /etc/criu/
echo tcp-established > /etc/criu/runc.conf
echo "{\"experimental\": true}" >> /etc/docker/daemon.json
systemctl restart docker