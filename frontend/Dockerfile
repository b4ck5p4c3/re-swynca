FROM node:22-slim
ENV NODE_ENV=production
RUN ["corepack", "enable"]
COPY ./package.json ./pnpm-lock.yaml ./
RUN ["pnpm", "install", "--frozen-lockfile"]
COPY . .
ARG SENTRY_AUTH_TOKEN
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AUTH_URL
RUN ["pnpm", "run", "build"]
CMD ["pnpm", "run", "start"]