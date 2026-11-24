# syntax=docker/dockerfile:1.7
# Multi-stage build for the NestJS kernel API. Base images are pinned; bump deliberately.
ARG NODE_IMAGE=node:22.12.0-bookworm-slim

# ---- deps: production + dev dependencies for the build ----------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npx nest build && npm prune --omit=dev --no-audit --no-fund

# ---- runtime ----------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    APP_ENV=production \
    PORT=8001 \
    LOG_LEVEL=info
WORKDIR /app
# Run as the unprivileged "node" user shipped with the image
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
RUN mkdir -p /app/var && chown node:node /app/var
USER node
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# The process handles SIGTERM/SIGINT itself (graceful drain), so it can be PID 1.
# Create/verify the schema first with:  docker run --rm <image> node dist/migrate.js
CMD ["node", "dist/main.js"]
