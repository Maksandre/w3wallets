# Copy Foundry binaries from official image
FROM ghcr.io/foundry-rs/foundry:latest AS foundry

# Use full node image - has everything we need
FROM node:20

# Copy Foundry binaries
COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge
COPY --from=foundry /usr/local/bin/cast /usr/local/bin/cast
COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil

# Enable Yarn
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

WORKDIR /app

# Copy workspace files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/test-dapp ./packages/test-dapp

# Install dependencies
RUN yarn install

WORKDIR /app/packages/test-dapp

# Install Foundry libs
RUN rm -rf lib && git init && \
    forge install foundry-rs/forge-std --no-git && \
    forge install OpenZeppelin/openzeppelin-contracts --no-git

# Compile contracts & build frontend
RUN forge build && yarn build

EXPOSE 3001

CMD ["yarn", "start"]
