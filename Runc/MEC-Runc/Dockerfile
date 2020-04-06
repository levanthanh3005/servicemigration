From levanthanh3005/runc:v0.1
#https://github.com/levanthanh3005/servicemigration/blob/master/ImageTest/DockerNode/runc.docker

ENV NODE_VERSION 8.9.0

RUN apt-get install build-essential libssl-dev

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 8.9.0

WORKDIR $NVM_DIR

RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
RUN node -v

#ADD . node
RUN npm install -g express body-parser request ejs
RUN mkdir /root/tmp
#RUN mkdir /root/containerroots
#CMD node server.js

#docker build -t mecrunc .
#docker tag mecrunc levanthanh3005/runc:v0.1
#docker push levanthanh3005/runc:v0.1