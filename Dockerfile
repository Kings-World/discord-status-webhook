FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build src/index.ts \
	--compile \
	--bytecode \
	--format=esm \
	--minify \
	--sourcemap \
	--outfile server

# FROM gcr.io/distroless/base
FROM oven/bun:1

WORKDIR /app

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

ENV NODE_ENV=production

COPY --from=build /app/server server
COPY --from=build /app/index.js.map index.js.map
COPY ./migrations ./migrations

EXPOSE 3000

STOPSIGNAL SIGINT

ENTRYPOINT ["./server"]
