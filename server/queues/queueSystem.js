const { redis, isRedisAvailable } = require('../redisClient');

// Optional require for BullMQ
const BullMQ = (() => {
  try {
    return require('bullmq');
  } catch (err) {
    console.warn('[QUEUE WARNING] bullmq module not installed. Queues will operate in fallback mode.');
    return null;
  }
})();

const QUEUE_NAMES = {
  EMAIL: 'emailQueue',
  MEDIA: 'mediaQueue',
  NOTIFICATION: 'notificationQueue',
};

const queues = {};
const fallbackHandlers = {};

const connectionOptions = (() => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
})();

/**
 * Initialize a BullMQ queue instance or fallback queue setup.
 * @param {string} queueName
 */
const getOrCreateQueue = (queueName) => {
  if (queues[queueName]) {
    return queues[queueName];
  }

  if (BullMQ && BullMQ.Queue && isRedisAvailable()) {
    try {
      const queue = new BullMQ.Queue(queueName, {
        connection: connectionOptions,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      });
      queues[queueName] = queue;
      console.log(`[QUEUE SYSTEM] Initialized BullMQ Queue: ${queueName}`);
      return queue;
    } catch (err) {
      console.error(`[QUEUE INIT ERROR] Failed to create BullMQ queue ${queueName}:`, err.message);
    }
  }

  return null;
};

/**
 * Add a job to a named queue.
 * Fallbacks to executing the registered inline handler if Redis/BullMQ is offline.
 * @param {string} queueName - e.g. 'emailQueue', 'mediaQueue', 'notificationQueue'
 * @param {string} jobName - e.g. 'sendEmail', 'processPoster'
 * @param {object} payload
 * @param {object} options
 */
const addJob = async (queueName, jobName, payload = {}, options = {}) => {
  const queue = getOrCreateQueue(queueName);

  if (queue) {
    try {
      const job = await queue.add(jobName, payload, options);
      console.log(`[QUEUE ADD] Enqueued job '${jobName}' in queue '${queueName}' (Job ID: ${job.id})`);
      return { status: 'queued', jobId: job.id, queue: queueName };
    } catch (err) {
      console.error(`[QUEUE ADD ERROR] Failed to enqueue job '${jobName}' in ${queueName}:`, err.message);
    }
  }

  // Fallback mode: Run registered fallback handler asynchronously
  const handler = fallbackHandlers[`${queueName}:${jobName}`] || fallbackHandlers[queueName];
  if (handler) {
    console.log(`[QUEUE FALLBACK] Executing job '${jobName}' in fallback async mode...`);
    setImmediate(async () => {
      try {
        await handler({ name: jobName, data: payload });
      } catch (handlerErr) {
        console.error(`[QUEUE FALLBACK ERROR] Job '${jobName}' failed:`, handlerErr.message);
      }
    });
    return { status: 'fallback_executed', queue: queueName };
  }

  console.warn(`[QUEUE WARNING] No handler available for queue '${queueName}', job '${jobName}'. Job skipped.`);
  return { status: 'skipped', queue: queueName };
};

/**
 * Register a worker processor for a queue (used in worker.js or fallback mode).
 * @param {string} queueName
 * @param {function} processorFunction - async (job) => { ... }
 */
const registerWorker = (queueName, processorFunction) => {
  fallbackHandlers[queueName] = processorFunction;

  if (BullMQ && BullMQ.Worker && isRedisAvailable()) {
    try {
      const worker = new BullMQ.Worker(queueName, processorFunction, {
        connection: connectionOptions,
        concurrency: 5,
      });

      worker.on('completed', (job) => {
        console.log(`[QUEUE WORKER SUCCESS] Job '${job.name}' (ID: ${job.id}) completed in ${queueName}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[QUEUE WORKER FAIL] Job '${job?.name}' (ID: ${job?.id}) failed in ${queueName}:`, err.message);
      });

      console.log(`[QUEUE WORKER REGISTERED] Listening on queue: ${queueName}`);
      return worker;
    } catch (err) {
      console.error(`[QUEUE WORKER REGISTRATION ERROR] ${queueName}:`, err.message);
    }
  }

  console.log(`[QUEUE WORKER FALLBACK REGISTERED] Registered local fallback listener for ${queueName}`);
  return null;
};

module.exports = {
  QUEUE_NAMES,
  addJob,
  registerWorker,
  getOrCreateQueue,
};
