FROM ghcr.io/puppeteer/puppeteer:22.4.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable


WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN chown -R node /usr/src/app/node_modules

USER node

CMD ["node" , "index.js"]