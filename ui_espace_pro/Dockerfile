ARG DOCTRINA_ENV=production

FROM node:18-bullseye AS base

ARG REACT_APP_BASE_URL
ARG REACT_APP_METABASE_URL
ARG REACT_APP_ENV
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_METABASE_URL=$REACT_APP_METABASE_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

#Install dependencies only when needed
# WORKDIR /app
# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile
# COPY . ./
#https://github.com/webpack/webpack/issues/14532
ENV NODE_OPTIONS=--openssl-legacy-provider
EXPOSE 3000
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . ./

# Rebuild the source code only when needed
# FROM node:16-alpine AS builder-production
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN INLINE_RUNTIME_CHUNK=false yarn build

# # Production image, copy all the files and run next
# FROM node:16-alpine AS ui-production
# WORKDIR /app

# ENV NODE_ENV production

# COPY --from=builder-production /app/build /site
# # COPY --from=builder-production /app/package.json ./
# RUN yarn global add local-web-server
# EXPOSE 3000
# ENV PORT 3000
# CMD ["yarn", "serve"]

FROM base as ui-production
RUN yarn global add local-web-server
RUN mkdir /site
RUN INLINE_RUNTIME_CHUNK=false yarn build && mv /app/build /site/espace-pro
CMD ["yarn", "serve"]



FROM base AS ui-dev
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
ENV PORT 3000
CMD ["yarn", "start"]

# FROM ui-dev as final
FROM ui-${DOCTRINA_ENV} as final