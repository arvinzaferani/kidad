FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --workspace apps/web --include-workspace-root=false

COPY apps/web ./apps/web

RUN npm --prefix apps/web run build

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "start"]
