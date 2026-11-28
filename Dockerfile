# syntax=docker/dockerfile:1@sha256:572cebbc2b15e6f84c077742952674889cb63cd5e9b80abdffcbe587b6f19183
# check=error=true

FROM oven/bun:1@sha256:3aa040e5445efa09d75bb428a64ba50db13e2b3ac9b6b0c7f145615f62b2ee18 AS build

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

FROM gcr.io/distroless/base:nonroot@sha256:7088bf1cdc94a65af4e0d5ad94518ed489a372dec1ece38ff4411c6c15fb5864

WORKDIR /app

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

ENV NODE_ENV=production

COPY --chown=nonroot:nonroot --chmod=555 --from=build /app/server server
COPY --chown=nonroot:nonroot --chmod=555 ./migrations ./migrations

USER nonroot

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
