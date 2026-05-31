const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Transcodes a local MP4 file into HLS format (index.m3u8 + ts segments).
 * @param {string} inputPath - Path to the local MP4 file
 * @param {string} outputDir - Directory to save HLS files
 * @returns {Promise<{playlistPath: string, segmentPaths: string[]}>}
 */
const transcodeToHls = async (inputPath, outputDir) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const playlistPath = path.join(outputDir, 'index.m3u8');
  const segmentPattern = path.join(outputDir, 'seg_%03d.ts');

  // Command to transcode to HLS using libx264 and aac
  const ffmpegCmd = `ffmpeg -i "${inputPath}" -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${segmentPattern}" "${playlistPath}"`;

  console.log(`[HLS TRANSCODE] Running command: ${ffmpegCmd}`);
  await execPromise(ffmpegCmd);
  console.log(`[HLS TRANSCODE] Transcoding completed successfully!`);

  const files = fs.readdirSync(outputDir);
  const segmentPaths = files
    .filter(f => f.endsWith('.ts'))
    .map(f => path.join(outputDir, f));

  return {
    playlistPath,
    segmentPaths,
  };
};

module.exports = { transcodeToHls };
