FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --workspace apps/api --include-workspace-root=false

COPY apps/api ./apps/api

RUN npm --prefix apps/api run build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["npm", "run", "start"]
