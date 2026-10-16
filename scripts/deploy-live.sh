#!/usr/bin/env bash
# Deploys dist/ to the live lyrcloud.com setup: the hand-made CloudFront distributions in
# front of the `lyrcloud.com` S3 bucket (DNS on Cloudflare). This is NOT the CloudFormation
# setup in infra/aws/ — do not run deploy-aws.sh against production.
set -euo pipefail

BUCKET="${BUCKET:-lyrcloud.com}"
DISTRIBUTIONS="${DISTRIBUTIONS:-E1SVV9NS4W24SZ E2LNC26IKJXUOS}" # www, apex
FUNCTION_NAME="${FUNCTION_NAME:-lyrcloud-url-rewrite}"

npm run check

# 1. Publish the clean-URL function (/pricing -> /pricing/index.html) if not live yet.
STAGE_ETAG="$(aws cloudfront describe-function --name "$FUNCTION_NAME" --stage DEVELOPMENT --query ETag --output text)"
if ! aws cloudfront describe-function --name "$FUNCTION_NAME" --stage LIVE >/dev/null 2>&1; then
  aws cloudfront publish-function --name "$FUNCTION_NAME" --if-match "$STAGE_ETAG" >/dev/null
  echo "Published $FUNCTION_NAME"
fi
FUNCTION_ARN="$(aws cloudfront describe-function --name "$FUNCTION_NAME" --stage LIVE --query FunctionSummary.FunctionMetadata.FunctionARN --output text)"

# 2. Upload the site. HTML always revalidates; assets aren't content-hashed, so cache them briefly.
#    No --delete: the bucket is versioned, and stray files are harmless.
aws s3 sync dist/ "s3://$BUCKET/" --exclude "*.html" --cache-control "public,max-age=3600"
aws s3 sync dist/ "s3://$BUCKET/" --exclude "*" --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate" --content-type "text/html; charset=utf-8"

# 3. Attach the function and 404 page to each distribution, then invalidate.
for id in $DISTRIBUTIONS; do
  config="$(mktemp)"
  etag="$(aws cloudfront get-distribution-config --id "$id" --query ETag --output text)"
  aws cloudfront get-distribution-config --id "$id" --query DistributionConfig --output json |
    FUNCTION_ARN="$FUNCTION_ARN" python3 -c '
import json, os, sys
config = json.load(sys.stdin)
config["DefaultCacheBehavior"]["FunctionAssociations"] = {
    "Quantity": 1,
    "Items": [{"FunctionARN": os.environ["FUNCTION_ARN"], "EventType": "viewer-request"}],
}
config["CustomErrorResponses"] = {
    "Quantity": 2,
    "Items": [
        {"ErrorCode": code, "ResponseCode": "404", "ResponsePagePath": "/404.html", "ErrorCachingMinTTL": 60}
        for code in (403, 404)
    ],
}
json.dump(config, sys.stdout)
' >"$config"
  aws cloudfront update-distribution --id "$id" --if-match "$etag" --distribution-config "file://$config" >/dev/null
  rm -f "$config"
  aws cloudfront create-invalidation --distribution-id "$id" --paths "/*" >/dev/null
  echo "Updated and invalidated $id"
done

echo "Done. CloudFront takes a few minutes to roll out; check https://www.lyrcloud.com/pricing"
