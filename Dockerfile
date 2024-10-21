# ================ #
#    Base Stage    #
# ================ #

FROM node:lts-alpine AS base

WORKDIR /app

ENV HUSKY=0
ENV CI=true
ENV FORCE_COLOR=true

LABEL author="Seren_Modz 21" maintainer="seren@kings-world.net"

RUN apk add --no-cache dumb-init

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base AS builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.json .
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--enable-source-maps"

COPY --chown=node:node --from=builder /app/dist dist
COPY --chown=node:node --from=builder /app/node_modules node_modules

COPY --chown=node:node ./entrypoint.sh /
RUN chmod +x /entrypoint.sh

USER node

EXPOSE 3000

CMD ["/entrypoint.sh"]
