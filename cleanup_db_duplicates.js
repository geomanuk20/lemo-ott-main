const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Movie = require('./server/models/Movie');
const Show = require('./server/models/Show');
const NewRelease = require('./server/models/NewRelease');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';

const cleanup = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    // 1. Clean up Movies
    const movies = await Movie.find();
    console.log(`Processing ${movies.length} movies...`);
    for (const movie of movies) {
      let changed = false;
      
      if (movie.actors && movie.actors.length > 0) {
        const uniqueActors = [...new Set(movie.actors.map(id => id.toString()))];
        if (uniqueActors.length !== movie.actors.length) {
          movie.actors = uniqueActors;
          changed = true;
        }
      }
      
      if (movie.directors && movie.directors.length > 0) {
        const uniqueDirectors = [...new Set(movie.directors.map(id => id.toString()))];
        if (uniqueDirectors.length !== movie.directors.length) {
          movie.directors = uniqueDirectors;
          changed = true;
        }
      }

      if (changed) {
        await movie.save();
        console.log(`\u2705 Deduplicated cast for Movie: "${movie.title}"`);
      }
    }

    // 2. Clean up Shows
    const shows = await Show.find();
    console.log(`Processing ${shows.length} shows...`);
    for (const show of shows) {
      let changed = false;
      
      if (show.actors && show.actors.length > 0) {
        const uniqueActors = [...new Set(show.actors.map(id => id.toString()))];
        if (uniqueActors.length !== show.actors.length) {
          show.actors = uniqueActors;
          changed = true;
        }
      }
      
      if (show.directors && show.directors.length > 0) {
        const uniqueDirectors = [...new Set(show.directors.map(id => id.toString()))];
        if (uniqueDirectors.length !== show.directors.length) {
          show.directors = uniqueDirectors;
          changed = true;
        }
      }

      if (changed) {
        await show.save();
        console.log(`\u2705 Deduplicated cast for Show: "${show.title}"`);
      }
    }

    // 3. Clean up New Releases
    const releases = await NewRelease.find();
    console.log(`Processing ${releases.length} new releases...`);
    for (const release of releases) {
      let changed = false;
      
      if (release.actors && release.actors.length > 0) {
        const uniqueActors = [...new Set(release.actors.map(id => id.toString()))];
        if (uniqueActors.length !== release.actors.length) {
          release.actors = uniqueActors;
          changed = true;
        }
      }
      
      if (release.directors && release.directors.length > 0) {
        const uniqueDirectors = [...new Set(release.directors.map(id => id.toString()))];
        if (uniqueDirectors.length !== release.directors.length) {
          release.directors = uniqueDirectors;
          changed = true;
        }
      }

      if (changed) {
        await release.save();
        console.log(`\u2705 Deduplicated cast for New Release: "${release.title}"`);
      }
    }

    console.log('\u2728 Database cleanup completed!');
  } catch (err) {
    console.error('Error during database cleanup:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

cleanup();
