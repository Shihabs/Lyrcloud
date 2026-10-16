#!/usr/bin/env bash
# Packages api/account/ and updates the live lyrcloud-account-api stack (infra/aws/account-api.yml).
# Existing parameters (user pool, client, origins) are kept; only the code and template change.
set -euo pipefail

STACK="${STACK:-lyrcloud-account-api}"
ARTIFACTS_BUCKET="${ARTIFACTS_BUCKET:-lyrcloud-deploy-artifacts}"

node --test api/account/roles.test.mjs

build="$(mktemp -d)"
trap 'rm -rf "$build"' EXIT
cp api/account/index.mjs api/account/roles.mjs "$build/"
(cd "$build" && zip -q -X code.zip index.mjs roles.mjs)
key="account-api/$(sha256sum "$build/code.zip" | cut -d' ' -f1).zip"
aws s3 cp "$build/code.zip" "s3://$ARTIFACTS_BUCKET/$key" >/dev/null

aws cloudformation deploy \
  --stack-name "$STACK" \
  --template-file infra/aws/account-api.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides "LambdaCodeS3Key=$key"

echo "Deployed $STACK with $key"
