import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { createLogger } from './utils/logger.js';

const config = loadConfig();
const logger = createLogger(config.logging.level, config.logging.file);

const app = createApp();
const port = config.server.port;

app.listen(port, () => {
  logger.info(`Claude Code REST API server started`, { port });
  logger.info(`Health check: http://localhost:${port}/api/v1/health`);
  logger.info(`API info: http://localhost:${port}/api/v1/info`);
});
