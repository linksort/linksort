FROM node:20-bookworm AS frontend-builder
WORKDIR /opt/linksort
ARG REACT_APP_SENTRY_DSN
ENV REACT_APP_SENTRY_DSN=${REACT_APP_SENTRY_DSN}
COPY ./frontend/package.json ./frontend/yarn.lock ./
RUN yarn
COPY ./frontend .
RUN yarn build

FROM node:20-bookworm AS splash-builder
WORKDIR /opt/linksort
COPY ./splash/package.json ./splash/yarn.lock ./
RUN yarn
COPY ./splash .
RUN yarn build

FROM golang:1.25 AS api-builder
WORKDIR /opt/linksort/
RUN mkdir build
COPY ./go.mod ./go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o ./build/serve ./cmd/serve/main.go

FROM alpine
WORKDIR /opt/linksort/
RUN mkdir bin
RUN mkdir assets
COPY --from=frontend-builder /opt/linksort/build ./assets
RUN mv ./assets/index.html ./assets/app.html
COPY --from=splash-builder /opt/linksort/public ./assets
COPY --from=api-builder /opt/linksort/build/serve ./bin
CMD ["./bin/serve"]
