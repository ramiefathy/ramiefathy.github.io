#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="20.17.0"
NODE_DIST="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-arm64.tar.gz"
NODE_DEST="/tmp/node20"
ESBUILD_VERSION="0.25.9"
ESBUILD_DIST="https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-${ESBUILD_VERSION}.tgz"
ESBUILD_DEST="/tmp/esbuild-0259"

echo "Downloading Node ${NODE_VERSION} to ${NODE_DEST}"
rm -rf "${NODE_DEST}" "${NODE_DEST}.tar.gz"
curl -L "${NODE_DIST}" -o "${NODE_DEST}.tar.gz"
mkdir -p "${NODE_DEST}"
tar -xzf "${NODE_DEST}.tar.gz" -C "${NODE_DEST}" --strip-components=1
rm "${NODE_DEST}.tar.gz"

echo "Downloading esbuild ${ESBUILD_VERSION} binary to ${ESBUILD_DEST}"
rm -rf "${ESBUILD_DEST}"
mkdir -p "${ESBUILD_DEST}"
curl -L "${ESBUILD_DIST}" | tar -xz -C "${ESBUILD_DEST}"

echo "Done. Use the following when installing/building Astro:"
echo "  PATH=${NODE_DEST}/bin:\$PATH ESBUILD_BINARY_PATH=${ESBUILD_DEST}/package/bin/esbuild npm --prefix site install"
