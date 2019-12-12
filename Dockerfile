FROM node:10-alpine as dist
WORKDIR /tmp/
COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
COPY src/ src/
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN npm install
RUN npm run build

FROM node:10-alpine as node_modules
WORKDIR /tmp/
COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN npm install --production

FROM node:10-alpine
RUN apk --no-cache upgrade && apk add --no-cache \
    udev \
    chromium
COPY fonts/ /usr/local/share/fonts/
RUN apk add --no-cache font-noto-cjk \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
WORKDIR /app
ENV CHROME_BIN="/usr/bin/chromium-browser"
COPY --from=node_modules /tmp/node_modules ./node_modules
COPY --from=dist /tmp/dist ./dist
CMD ["node", "dist/main.js"]