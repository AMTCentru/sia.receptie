# Folosim Alpine ca bază
FROM alpine:3.19

# Actualizăm pachetele și instalăm Chromium, Node.js și alte dependențe necesare
RUN apk upgrade --no-cache --available \
    && apk add --no-cache \
    chromium-swiftshader \
    ttf-freefont \
    nodejs \
    npm \
    bash \
    udev

WORKDIR /usr/src/app

# Configurăm variabilele de mediu pentru Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    CHROMIUM_FLAGS="--disable-software-rasterizer --disable-dev-shm-usage --no-sandbox"

# Copiem fișierele proiectului
COPY package*.json ./

ENV PUPPETEER_SKIP_DOWNLOAD=true

# Instalăm dependențele Node.js
RUN npm install

# Copiem restul fișierelor aplicației
COPY . .
RUN npm run build

# Comanda implicită
CMD ["node", "dist/main"]
