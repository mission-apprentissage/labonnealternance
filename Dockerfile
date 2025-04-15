FROM node:23-slim AS builder_root
WORKDIR /app
RUN yarn set version 3.3.1
COPY .yarn /app/.yarn
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY ui/package.json ui/package.json
COPY server/package.json server/package.json
COPY shared/package.json shared/package.json

RUN yarn install --immutable

COPY . .

RUN yarn typecheck

FROM builder_root AS root
WORKDIR /app

##############################################################
######################    SERVER    ##########################
##############################################################

# Rebuild the source code only when needed
FROM root AS builder_server
WORKDIR /app

COPY ./server ./server
COPY ./shared ./shared

RUN yarn --cwd server build

RUN mkdir -p /app/shared/node_modules && mkdir -p /app/server/node_modules

# Production image, copy all the files and run next
FROM node:23-slim AS server
WORKDIR /app
RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ARG PUBLIC_VERSION
ENV PUBLIC_VERSION=$PUBLIC_VERSION
ARG COMMIT_HASH
ENV COMMIT_HASH=$COMMIT_HASH

COPY --from=builder_server /app/server ./server
COPY --from=builder_server /app/shared ./shared
COPY --from=builder_server /app/node_modules ./node_modules
COPY --from=builder_server /app/server/node_modules ./server/node_modules
COPY --from=builder_server /app/shared/node_modules ./shared/node_modules
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

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

ARG PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$PUBLIC_VERSION
ARG COMMIT_HASH
ENV COMMIT_HASH=$COMMIT_HASH

ARG PUBLIC_ENV
ENV NEXT_PUBLIC_ENV=$PUBLIC_ENV

ENV __SENTRY_DEBUG__=false
ENV __RRWEB_EXCLUDE_IFRAME__=true
ENV __RRWEB_EXCLUDE_SHADOW_DOM__=true
ENV __SENTRY_EXCLUDE_REPLAY_WORKER__=true

RUN yarn --cwd ui build
# RUN --mount=type=cache,target=/app/ui/.next/cache yarn --cwd ui build

# Production image, copy all the files and run next
FROM node:23-slim AS ui
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

ARG PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=$PUBLIC_VERSION
ARG COMMIT_HASH
ENV COMMIT_HASH=$COMMIT_HASH

ARG PUBLIC_ENV
ENV NEXT_PUBLIC_ENV=$PUBLIC_ENV

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/next.config.mjs /app/
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/public /app/ui/public
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/package.json /app/ui/package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/.next/standalone /app/
COPY --from=builder_ui --chown=nextjs:nodejs /app/ui/.next/static /app/ui/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "ui/server"]
