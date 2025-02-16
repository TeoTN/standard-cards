#!/bin/bash
set -e

# Ensure jq is installed
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not installed. Please install it (e.g., 'brew install jq')."
  exit 1
fi

# Retrieve the latest tag. If none exists, show "None".
latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "None")

# Prompt for desired version and release message, showing newest tag
read -p "Enter new version (latest: ${latest_tag}): " new_version
read -p "Enter release message: " release_message

# Strip leading "v" from the version for package.json update.
version_for_package="${new_version#v}"

# Update package.json version field using jq with the stripped version.
jq --arg version "$version_for_package" '.version = $version' package.json > package.tmp.json && mv package.tmp.json package.json

# Stage package.json and commit the change
git add package.json
git commit -m "release: Version bump (${new_version})"

# Create an annotated git tag with the provided message (using full version)
git tag -a "$new_version" -m "$release_message"

# Push the commit and tags to remote origin
git push origin HEAD
git push origin --tags

echo "Release ${new_version} created successfully."
