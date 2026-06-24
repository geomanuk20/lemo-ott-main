#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "fix: resolve live tv mobile playback issue, status inactive filtering on mobile & backend, web youtube bypass"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Please pull this on your live server and restart PM2/Node."
