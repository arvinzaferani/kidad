FROM node:20-alpine AS base

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL=https://api.kidad.ir/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG FRONTEND_ORIGIN=https://kidad.ir
ENV FRONTEND_ORIGIN=$FRONTEND_ORIGIN

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --workspace apps/web --include-workspace-root=false

COPY apps/web ./apps/web

RUN npm --prefix apps/web run build

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "run", "start"]
