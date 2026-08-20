#!/bin/bash

# Builds the prod images for api, realtime, and keycloak.
# The api/realtime dockerfile.prod images install dependencies and
# build the app at build time, so this must run whenever code or
# dependencies change. Each expects a pre-pruned monorepo subset at
# apps/<app>/out (via `turbo prune --docker`), so that runs first.
#
# keycloak isn't an npm workspace -- its dockerfile.prod just bakes
# apps/keycloak/my-themes and realm-export.prod.json into the official image.
set -e

APPS=(api realtime)

for APP in "${APPS[@]}"; do
  echo "Pruning workspace $APP into apps/$APP/out..."
  # Prune to a temp dir outside apps/$APP first: pruning straight into
  # apps/$APP/out makes turbo copy apps/$APP into itself recursively,
  # since apps/$APP/out would already exist as it walks apps/$APP.
  rm -rf out "apps/$APP/out"
  npx turbo prune "$APP" --docker
  mv out "apps/$APP/out"

  echo "Building Docker image $APP using apps/$APP/dockerfile.prod..."
  docker build \
    -f "apps/$APP/dockerfile.prod" \
    -t "$APP" --progress=plain \
    .
  rm -rf "apps/$APP/out"
  echo "Docker image $APP built successfully!"
done

# keycloak não é um workspace npm (não passa por turbo prune) -- só embute
# apps/keycloak/my-themes e realm-export.prod.json na imagem oficial.
echo "Building Docker image keycloak using apps/keycloak/dockerfile.prod..."
docker build \
  -f apps/keycloak/dockerfile.prod \
  -t keycloak --progress=plain \
  .
echo "Docker image keycloak built successfully!"
