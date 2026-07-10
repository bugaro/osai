FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm install -g tsx
CMD ["tsx", "src/server.ts"]
