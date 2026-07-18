# syntax=docker/dockerfile:1@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89
# check=error=true

FROM oven/bun:1@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4 AS build

WORKDIR /app

COPY --chmod=444 package.json bun.lock ./

RUN bun install --frozen-lockfile --production --ignore-scripts

COPY --chmod=555 ./src ./src

ENV NODE_ENV=production

RUN bun build src/index.ts \
	--compile \
	--bytecode \
	--format=esm \
	--minify \
	--sourcemap \
	--outfile server

FROM gcr.io/distroless/base:nonroot@sha256:97b9d04bed1c754b756c3c4b6a04915c22fb0b5d96a59944eb3bf78c26e6e157

WORKDIR /app

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

ENV NODE_ENV=production

COPY --chown=nonroot:nonroot --chmod=555 --from=build /app/server server
COPY --chown=nonroot:nonroot --chmod=555 ./migrations ./migrations

USER nonroot

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
