FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=development
RUN npm install --include=dev
EXPOSE 8000
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "dist/main.js"]
