# CCN Matrix bot (sandbox) — © Computational Classnotes · CC BY-NC-SA 4.0
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
USER node
CMD ["node", "src/index.mjs"]
