# syntax=docker/dockerfile:1
# check=error=true

FROM oven/bun:1 AS build

WORKDIR /app

COPY --chmod=444 package.json bun.lock ./

RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
	bun install --frozen-lockfile --production --ignore-scripts

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

COPY --chown=nonroot:nonroot --chmod=555 --from=build /app/server server
COPY --chown=nonroot:nonroot --chmod=555 ./migrations ./migrations

USER nonroot

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
