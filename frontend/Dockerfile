FROM node:21-slim
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn --frozen-lockfile
COPY . .
ARG SENTRY_AUTH_TOKEN
RUN yarn build
CMD yarn start