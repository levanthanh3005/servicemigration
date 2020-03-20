From levanthanh3005/runc:v0.1

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

RUN mkdir $HOME/containerroots

ADD . /todo
WORKDIR /todo

RUN npm install express body-parser request

CMD node server.js