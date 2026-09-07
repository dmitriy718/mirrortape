FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run lint && npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
COPY --from=build /app/server/migrations ./server/migrations
ARG RELEASE_COMMIT
LABEL org.opencontainers.image.source="https://github.com/dmitriy718/mirrortape" org.opencontainers.image.revision=$RELEASE_COMMIT
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 CMD node -e 'fetch("http://127.0.0.1:8080/health/ready").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'
CMD ["node", "server-dist/index.js"]
