#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "fix: single row form alignment, mobile view responsiveness & button alignment fixes across admin dashboard

- Fixed single-row horizontal form alignment in GeneralSettings.jsx and PlayerConfig.jsx
- Fixed Analytics.jsx header action button alignment, custom date pickers, printable report CSS, and touch-scroll category tabs on mobile
- Fixed mobile view 2-column card grid and centered action controls in Genres.jsx, Languages.jsx, SportsCategory.jsx, TVCategory.jsx, and HomeSections.jsx
- Fixed Slider.jsx grid minmax overflow, card badges wrapping, and equal height top action buttons
- Fixed Images.jsx search bar full width and button text clipping on mobile
- Fixed UsersList.jsx & DeletedUsers.jsx Add User button text visibility, equal action button heights, and scrollable data tables on mobile
- Removed title tooltip popovers from Header.jsx toggle sidebar button on mobile touch"

echo "Pushing to GitHub..."
git push origin main

echo "Done! All changes pushed to GitHub."
