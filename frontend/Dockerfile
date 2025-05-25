FROM node:22-slim
ENV NODE_ENV=production
RUN ["corepack", "enable"]
COPY ./package.json ./pnpm-lock.yaml ./
RUN ["pnpm", "install", "--frozen-lockfile"]
COPY . .
ARG SENTRY_AUTH_TOKEN
RUN ["pnpm", "run", "build"]
CMD ["pnpm", "run", "start"]