#!/bin/bash

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Determine the ref to checkout based on context
# Usage: ./determine-ref.sh [provided_ref]
PROVIDED_REF="${1:-}"

# If a ref is explicitly provided, use it
if [[ -n "$PROVIDED_REF" ]]; then
  echo "Using provided ref: $PROVIDED_REF"
  echo "ref=$PROVIDED_REF"
# If the event is a repository_dispatch and the client_payload contains a SHA, use it
elif [[ "${GITHUB_EVENT_NAME:-}" == "repository_dispatch" && -n "${GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA:-}" ]]; then
  echo "Using client_payload SHA: $GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA"
  echo "ref=$GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA"
else
  echo "Using default ref (empty)"
  echo "ref="
fi
