FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
