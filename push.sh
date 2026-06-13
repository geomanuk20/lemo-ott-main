#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "fix: resolve refund policy and terms of service display issues, add scroll-to-top handler, and update mobile app layout"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Please pull this on your live server and restart PM2/Node."
