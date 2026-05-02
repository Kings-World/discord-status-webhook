# syntax=docker/dockerfile:1
# check=error=true

FROM oven/bun:1 AS build

WORKDIR /app

COPY --chmod=444 package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY --chmod=555 ./src ./src

ENV NODE_ENV=production

RUN bun build src/index.ts \
	--compile \
	--bytecode \
	--format=esm \
	--minify \
	--sourcemap \
	--outfile server

FROM gcr.io/distroless/base:nonroot

WORKDIR /app

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

ENV NODE_ENV=production

COPY --from=build --chmod=555 /app/server server
COPY --from=build --chmod=444 /app/index.js.map index.js.map
COPY --chmod=555 ./migrations ./migrations

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
