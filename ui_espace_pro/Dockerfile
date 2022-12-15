ARG LBA_ENV=production

FROM node:18-bullseye AS base

ARG REACT_APP_BASE_URL
ARG REACT_APP_METABASE_URL
ARG REACT_APP_ENV
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_METABASE_URL=$REACT_APP_METABASE_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

# install dependencies
#https://github.com/webpack/webpack/issues/14532
ENV NODE_OPTIONS=--openssl-legacy-provider
EXPOSE 3000
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./

# build & serve production
FROM base as ui-production
RUN yarn global add local-web-server
RUN mkdir /site
#https://drag13.io/posts/react-inline-runtimer-chunk/index.html
RUN INLINE_RUNTIME_CHUNK=false yarn build && mv /app/build /site/espace-pro
CMD ["yarn", "serve"]


# serve development
FROM base AS ui-dev
EXPOSE 3000
ENV PORT 3000
CMD ["yarn", "start"]

# FROM ui-env as final
FROM ui-${LBA_ENV} as final