import { developmentLogger } from './development';
import { productionLogger } from './production';

const env = process.env.NODE_ENV || 'development';

// Export the appropriate logger based on environment

const logger = env === 'production' ? productionLogger : developmentLogger;
export default logger;