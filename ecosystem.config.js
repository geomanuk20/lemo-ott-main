/**
 * PM2 Process Management Ecosystem Configuration
 * Enterprise Architecture: 4 API Nodes + 1 Dedicated Background Worker Process
 */
module.exports = {
  apps: [
    {
      name: 'lemo-api-node-1',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
    {
      name: 'lemo-api-node-2',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
      },
    },
    {
      name: 'lemo-api-node-3',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
      },
    },
    {
      name: 'lemo-api-node-4',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 5004,
      },
    },
    {
      name: 'lemo-background-worker',
      script: './server/worker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
