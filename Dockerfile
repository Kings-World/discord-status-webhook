# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32
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

FROM gcr.io/distroless/base:nonroot@sha256:2d7d29b504e7166f6d0c7655a18ebf5def5b37b029f8c4f8667e434ba774844f

WORKDIR /app

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

ENV NODE_ENV=production

COPY --chown=nonroot:nonroot --chmod=555 --from=build /app/server server
COPY --chown=nonroot:nonroot --chmod=555 ./migrations ./migrations

USER nonroot

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
