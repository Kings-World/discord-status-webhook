# ================ #
#    Base Stage    #
# ================ #

FROM node:lts-alpine AS base

WORKDIR /app

ENV YARN_DISABLE_GIT_HOOKS=1 \
	FORCE_COLOR=true

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

RUN apk add --no-cache dumb-init

COPY --chown=node:node package.json yarn.lock .yarnrc.yml ./
COPY --chown=node:node .yarn/ .yarn/

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base AS builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.json .
COPY --chown=node:node src/ src/

RUN --mount=type=cache,id=yarn,target=/root/.yarn yarn install --immutable
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production" \
	NODE_OPTIONS="--enable-source-maps"

COPY --chown=node:node --from=builder /app/dist dist
COPY --chown=node:node --from=builder /app/node_modules node_modules

COPY --chown=node:node ./entrypoint.sh /
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 3000

CMD ["/entrypoint.sh"]
