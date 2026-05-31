const { MediaConvertClient, CreateJobCommand } = require('@aws-sdk/client-mediaconvert');

/**
 * Creates an AWS Elemental MediaConvert transcoding job to convert an MP4 video to HLS.
 * @param {string} inputS3Url - S3 URL of the input video (e.g. s3://bucket-name/inputs/video.mp4)
 * @param {string} outputS3Folder - S3 folder path for HLS output (e.g. s3://bucket-name/videos/hls_123/index)
 * @returns {Promise<object>} - Resolves to the created MediaConvert job object
 */
const createMediaConvertHlsJob = async (inputS3Url, outputS3Folder) => {
  const endpoint = process.env.AWS_MEDIACONVERT_ENDPOINT;
  const roleArn = process.env.AWS_MEDIACONVERT_ROLE_ARN;
  const region = process.env.AWS_REGION || 'ap-south-1';

  if (!endpoint || !roleArn) {
    throw new Error('AWS_MEDIACONVERT_ENDPOINT and AWS_MEDIACONVERT_ROLE_ARN must be configured in environment variables');
  }

  // Normalize endpoint URL (ensure it starts with https://)
  let formattedEndpoint = endpoint.trim();
  if (!formattedEndpoint.startsWith('https://')) {
    formattedEndpoint = `https://${formattedEndpoint}`;
  }

  // Initialize client with customer-specific endpoint (required by AWS MediaConvert SDK)
  const mediaConvertClient = new MediaConvertClient({
    region,
    endpoint: formattedEndpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const jobParams = {
    Role: roleArn,
    Settings: {
      Inputs: [
        {
          FileInput: inputS3Url,
          AudioSelectors: {
            "Audio Selector 1": {
              DefaultSelection: "DEFAULT"
            }
          },
          VideoSelector: {},
          TimecodeSource: "ZEROBASED"
        }
      ],
      OutputGroups: [
        {
          Name: "Apple HLS",
          OutputGroupSettings: {
            Type: "HLS_GROUP_SETTINGS",
            HlsGroupSettings: {
              SegmentLength: 6,
              MinSegmentLength: 0,
              Destination: outputS3Folder,
            }
          },
          Outputs: [
            {
              VideoDescription: {
                CodecSettings: {
                  Codec: "H_264",
                  H264Settings: {
                    RateControlMode: "QVBR",
                    SceneChangeDetect: "ENABLED",
                    MaxBitrate: 5000000,
                    QvbrSettings: {
                      QvbrQualityLevel: 7
                    },
                    GopSize: 90,
                    GopSizeUnits: "FRAMES"
                  }
                },
                Width: 1920,
                Height: 1080
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: "AAC",
                    AacSettings: {
                      Bitrate: 96000,
                      CodingMode: "CODING_MODE_2_0",
                      SampleRate: 48000
                    }
                  }
                }
              ],
              OutputSettings: {
                HlsSettings: {}
              },
              ContainerSettings: {
                Container: "M3U8"
              },
              NameModifier: "_1080p"
            }
          ]
        }
      ]
    }
  };

  console.log(`[MEDIACONVERT] Creating transcoding job for input: ${inputS3Url}...`);
  const response = await mediaConvertClient.send(new CreateJobCommand(jobParams));
  console.log(`[MEDIACONVERT] Job created successfully! Job ID: ${response.Job?.Id}`);
  return response.Job;
};

module.exports = { createMediaConvertHlsJob };
