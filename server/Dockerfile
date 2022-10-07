ARG DOCTRINA_ENV=production

FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
# FROM node:16-alpine AS builder-production
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules 

RUN yarn build

# Production image, copy all the files and run node
FROM node:18-alpine AS server-production
WORKDIR /app

ENV NODE_ENV production

COPY --from=deps /app/node_modules ./node_modules 
COPY --from=deps /app/build .
COPY --from=deps /app/package.json .

USER nodejs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]

FROM node:18-alpine AS server-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV PORT 3000
CMD ["yarn", "dev"]

FROM server-${DOCTRINA_ENV} as final