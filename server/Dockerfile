FROM node:16-stretch

#Install and cache node_modules
COPY package.json yarn.lock /tmp/
RUN cd /tmp && \
    yarn install --frozen-lockfile && \
    mkdir -p /app && \
    mv /tmp/node_modules /app/

COPY ./ /app
WORKDIR /app

VOLUME /data
EXPOSE 5000
CMD ["yarn", "start"]
