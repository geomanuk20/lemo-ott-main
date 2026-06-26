#!/bin/bash
echo "Staging all files..."
git add .

echo "Committing changes..."
git commit -m "fix: mobile view improvements across all frontend pages

- FrontendLiveTV: switch hero from fixed to relative on mobile (iOS fix), 2-col grid, margin-top removed
- FrontendMovies: same mobile hero fix, proper padding/grid on small screens
- FrontendShows: same mobile hero fix
- FrontendSports: same mobile hero fix, 2-col grid (was 1-col)
- FrontendShortFilms: same mobile hero fix
- FrontendWebSeries: same mobile hero fix
- FrontendNavbar: navbar is now position:fixed on mobile, schedule banner compact on mobile

Key fixes:
1. background-attachment:fixed removed on mobile (breaks iOS Safari)
2. Hero sections switch from position:fixed to position:relative on mobile
3. Content margin-top:0 on mobile (hero no longer fixed)
4. Grid layouts optimized for 2-col on 768px screens
5. Navbar fixed on mobile so it sticks while scrolling"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Please pull this on your live server and restart PM2/Node."
