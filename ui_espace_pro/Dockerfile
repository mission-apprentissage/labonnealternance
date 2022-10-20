ARG MNAPROJECTNAME_ENV=production

ARG REACT_APP_BASE_URL
ARG REACT_APP_METABASE_URL
ARG REACT_APP_ENV

ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_METABASE_URL=$REACT_APP_METABASE_URL
ENV REACT_APP_ENV=$REACT_APP_ENV


# Install dependencies only when needed
FROM node:16-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:16-alpine AS builder-production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Production image, copy all the files and run next
FROM node:16-alpine AS ui-production
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder-production /app/build ./build
COPY --from=builder-production /app/package.json ./
RUN yarn global add local-web-server
EXPOSE 3001
ENV PORT 3001
CMD ["yarn", "serve"]

FROM node:16-alpine AS ui-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001
ENV PORT 3001
CMD ["yarn", "start"]

FROM ui-${MNAPROJECTNAME_ENV} as final