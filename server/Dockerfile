ARG LBA_ENV=production

# Install packages
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY . .
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:18-alpine AS builder-production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules 
COPY . .
RUN yarn build

# Production image, copy all the files and run node
FROM node:18-alpine AS server-production
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder-production /app/build ./src
COPY --from=builder-production /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 5000
CMD ["node", "src/index.js"]

# Development image
FROM node:18-alpine AS server-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5000
CMD ["yarn", "dev"]

FROM server-${LBA_ENV} as final