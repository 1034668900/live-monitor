import logger from 'jet-logger';
import server from './server';
import { Env } from '@src/common/constants/ENV';

// Start the server
server.listen(Env.Port, err => {
  if (!!err) {
    logger.err(err.message);
  } else {
    logger.info('Express server started on port: ' + Env.Port.toString());
  }
});
