FROM node:20-alpine as builder_root
WORKDIR /app
RUN yarn set version 3.3.1
COPY .yarn /app/.yarn
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY ui/package.json ui/package.json
COPY ui_espace_pro/package.json ui_espace_pro/package.json
COPY server/package.json server/package.json

RUN --mount=type=cache,target=/app/.yarn/cache yarn install --immutable

FROM builder_root as root
WORKDIR /app

##############################################################
######################    SERVER    ##########################
##############################################################

# Rebuild the source code only when needed
FROM root AS builder_server
WORKDIR /app

COPY ./server ./server

RUN yarn --cwd server build
# Removing dev dependencies
RUN yarn workspaces focus --all --production
# Cache is not needed anymore
RUN rm -rf .yarn/cache

# Production image, copy all the files and run next
FROM node:20-alpine AS server
WORKDIR /app
RUN apk add --update \
  curl \
  && rm -rf /var/cache/apk/*

ENV NODE_ENV production
ARG PUBLIC_VERSION
ENV PUBLIC_VERSION=$PUBLIC_VERSION

COPY --from=builder_server /app/server ./server
COPY --from=builder_server /app/node_modules ./node_modules
COPY ./server/static /app/server/static

EXPOSE 5000
WORKDIR /app/server
CMD ["node", "dist/index.js", "start"]


##############################################################
######################      UI      ##########################
##############################################################

# Rebuild the source code only when needed
FROM root AS builder_ui
WORKDIR /app
COPY ./ui ./ui

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

ARG PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$PUBLIC_VERSION

ARG PUBLIC_ENV
ENV NEXT_PUBLIC_ENV=$PUBLIC_ENV

RUN --mount=type=cache,target=/app/ui/.next/cache yarn --cwd ui build
# Cache is not needed anymore
RUN rm -rf .yarn/cache

# Production image, copy all the files and run next
FROM node:20-alpine AS ui
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

ARG PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$PUBLIC_VERSION

ARG PUBLIC_ENV
ENV NEXT_PUBLIC_ENV=$PUBLIC_ENV

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder_ui /app/ui/next.config.js /app/
COPY --from=builder_ui /app/ui/public /app/ui/public
COPY --from=builder_ui /app/ui/package.json /app/ui/package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/.next/standalone /app/
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/.next/static /app/ui/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
CMD ["node", "ui/server"]

##############################################################
######################   UI ESPACE PRO  ######################
##############################################################

FROM root AS build_espace_pro
WORKDIR /app
COPY ./ui_espace_pro ./ui_espace_pro

ENV NODE_ENV production

ENV NODE_OPTIONS=--openssl-legacy-provider

ARG PUBLIC_VERSION
ENV REACT_APP_VERSION=$PUBLIC_VERSION

ARG PUBLIC_ENV
ENV REACT_APP_ENV=$PUBLIC_ENV

ENV DISABLE_ESLINT_PLUGIN=true
ENV INLINE_RUNTIME_CHUNK=false
ENV SKIP_PREFLIGHT_CHECK=true

#https://drag13.io/posts/react-inline-runtimer-chunk/index.html
RUN yarn --cwd ui_espace_pro build

FROM node:20-alpine as ui_espace_pro
RUN yarn global add local-web-server
RUN mkdir /site
COPY --from=build_espace_pro /app/ui_espace_pro/build /site/espace-pro
CMD ["yarn", "--cwd", "ui_espace_pro", "serve"]

