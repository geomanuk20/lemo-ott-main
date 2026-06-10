#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "fix: PhonePe production integration and watermark admin check"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Please pull this on your live server and restart PM2/Node."
