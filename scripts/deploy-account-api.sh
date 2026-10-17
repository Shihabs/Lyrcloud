#!/usr/bin/env bash
# Packages api/account/ and updates the live lyrcloud-account-api stack (infra/aws/account-api.yml).
# Existing parameters (user pool, client, origins) are kept; only the code and template change.
# Lyrbot reads its Anthropic API key from the AnthropicSecretName secret (default lyrshop/anthropic).
set -euo pipefail

STACK="${STACK:-lyrcloud-account-api}"
ARTIFACTS_BUCKET="${ARTIFACTS_BUCKET:-lyrcloud-deploy-artifacts}"

[[ -d node_modules/@anthropic-ai/sdk ]] || npm ci
npm test

# Bundled with its dependencies (the Anthropic SDK for Lyrbot isn't in the Lambda runtime).
build="$(mktemp -d)"
trap 'rm -rf "$build"' EXIT
npx esbuild index=api/account/index.mjs --bundle --platform=node --target=node22 \
  --format=esm --minify-syntax --outdir="$build" --out-extension:.js=.mjs --log-level=warning \
  --banner:js="import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);"
(cd "$build" && zip -q -X code.zip index.mjs)
key="account-api/$(sha256sum "$build/code.zip" | cut -d' ' -f1).zip"
aws s3 cp "$build/code.zip" "s3://$ARTIFACTS_BUCKET/$key" >/dev/null

aws cloudformation deploy \
  --stack-name "$STACK" \
  --template-file infra/aws/account-api.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "LambdaCodeS3Key=$key"

echo "Deployed $STACK with $key"
