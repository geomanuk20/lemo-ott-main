#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "feat: Hostinger VPS scalable backend setup, Analytics dashboard, custom date pickers & CTA UI fixes

- Added deploy_hostinger.sh, README_HOSTINGER_DEPLOYMENT.md & .env.production.example for 1-click Hostinger VPS deployment
- Added Analytics sub-menu under Dashboard in Admin Sidebar
- Created interactive Analytics.jsx page with Charts.js revenue trends, subscription doughnut chart & multi-category top content metrics
- Added Time Range filtering (7 days, 30 days, year, all) and Custom Date Picker selection (startDate & endDate)
- Fixed Subscription CTA section padding clipping and Chrome/Safari email autofill dark background override"

echo "Pushing to GitHub..."
git push origin main

echo "Done! All changes pushed to GitHub."
