#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "feat: Hostinger VPS scalable deployment setup, 10GB video upload limits, and footer background layout fixes"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Please pull this on your live server and restart PM2/Node."
