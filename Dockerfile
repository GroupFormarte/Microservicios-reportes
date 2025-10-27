# ---- Build stage ----
FROM node:20-bookworm-slim AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src
COPY views ./views
COPY public ./public
RUN npm run build

RUN npm prune --omit=dev

# ---- Runtime stage ----
FROM node:20-bookworm-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=3350 \
    PUPPETEER_DISABLE_HEADLESS_WARNING=true

RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libexpat1 \
  libgbm1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libxshmfence1 \
  wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/views ./views
COPY --from=build /app/public ./public
COPY package*.json ./

RUN mkdir -p /app/public/pdfs

RUN useradd -m -u 10001 nodeuser
USER nodeuser

EXPOSE 3350

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3350/health', r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/app.js"]
