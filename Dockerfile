FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS client

EXPOSE 80

COPY entry.sh /entry.sh
RUN chmod +x /entry.sh && \
    sed -i 's|application/json\s*json;|application/json json;\n    application/manifest+json webmanifest;|' /etc/nginx/mime.types

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /app

ENTRYPOINT ["/entry.sh"]
