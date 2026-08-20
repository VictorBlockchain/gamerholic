#!/usr/bin/env bash
# Static export for gh_assets (mainnet).
# Forces IC + gamerholic.fun II derivation so .env.local cannot mint new principals.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NEXT_EXPORT=1
export NEXT_PUBLIC_IC_NETWORK=ic
export NEXT_PUBLIC_IC_HOST=https://icp0.io
export NEXT_PUBLIC_GH_BACKEND_CANISTER_ID="${NEXT_PUBLIC_GH_BACKEND_CANISTER_ID:-u2in7-tiaaa-aaaab-qc2jq-cai}"
export NEXT_PUBLIC_GH_MEDIA_CANISTER_ID="${NEXT_PUBLIC_GH_MEDIA_CANISTER_ID:-ubnr2-jqaaa-aaaab-qc2la-cai}"
export NEXT_PUBLIC_II_URL="${NEXT_PUBLIC_II_URL:-https://identity.ic0.app}"
export NEXT_PUBLIC_APP_URL=https://gamerholic.fun
export NEXT_PUBLIC_II_DERIVATION_ORIGIN=https://gamerholic.fun

# Prefer production public env; temporarily park .env.local so local dfx IDs
# cannot override the IC build. Keep Supabase keys from .env.local first.
PARKED=""
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  # Export only needed public keys (ignore local host/canister overrides)
  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      NEXT_PUBLIC_SUPABASE_URL=*|NEXT_PUBLIC_SUPABASE_ANON_KEY=*)
        export "$line"
        ;;
    esac
  done < .env.local
  set +a
  PARKED=".env.local.park-for-ic-export"
  mv .env.local "$PARKED"
  echo "Parked .env.local → $PARKED (IC static build; kept Supabase public keys)"
fi
restore_env() {
  if [[ -n "$PARKED" && -f "$PARKED" ]]; then
    mv "$PARKED" .env.local
    echo "Restored .env.local"
  fi
}
trap restore_env EXIT

echo "IC static build public env:"
echo "  NEXT_PUBLIC_IC_NETWORK=$NEXT_PUBLIC_IC_NETWORK"
echo "  NEXT_PUBLIC_II_DERIVATION_ORIGIN=$NEXT_PUBLIC_II_DERIVATION_ORIGIN"
echo "  NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL"
echo "  NEXT_PUBLIC_GH_BACKEND_CANISTER_ID=$NEXT_PUBLIC_GH_BACKEND_CANISTER_ID"

# Profiles / chat / arcade require Supabase public keys baked into static export
if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  # Fall back to .env.production if export didn't pick up keys
  if [[ -f .env.production ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      case "$line" in
        NEXT_PUBLIC_SUPABASE_URL=*|NEXT_PUBLIC_SUPABASE_ANON_KEY=*)
          export "$line"
          ;;
      esac
    done < .env.production
  fi
fi
if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" || -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing." >&2
  echo "  Profiles will not save on mainnet. Set them in .env.local or .env.production." >&2
  exit 1
fi
echo "  NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL%%/*}//… (set)"

npx next build

# Asset canister only reads .ic-assets.json5 inside source dirs (out/)
if [[ -f public/.ic-assets.json5 ]]; then
  cp public/.ic-assets.json5 out/.ic-assets.json5
  echo "Copied public/.ic-assets.json5 → out/"
elif [[ -f .ic-assets.json5 ]]; then
  cp .ic-assets.json5 out/.ic-assets.json5
  echo "Copied .ic-assets.json5 → out/"
fi

if [[ -f out/.well-known/ii-alternative-origins ]]; then
  echo "OK: out/.well-known/ii-alternative-origins"
  cat out/.well-known/ii-alternative-origins
else
  echo "WARN: missing out/.well-known/ii-alternative-origins" >&2
  exit 1
fi

if [[ -f out/.well-known/ic-domains ]]; then
  echo "OK: out/.well-known/ic-domains"
  cat out/.well-known/ic-domains
fi

echo "Static export ready in out/"
