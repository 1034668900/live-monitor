import morgan from 'morgan';
import helmet from 'helmet';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import logger from 'jet-logger';
import { apiRouter } from '@src/routes';
import Paths from '@src/common/constants/Paths';
import { Env } from '@src/common/constants/ENV';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/util/route-errors';
import { NodeEnvs } from '@src/common/constants';
import processCors from './middleware/processCors';

const app = express();


// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Show routes called in console during development
if (Env.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

// Security
if (Env.NodeEnv === NodeEnvs.Production) {
  if (!process.env.DISABLE_HELMET) {
    app.use(helmet());
  }
}

app.use(processCors);

// Add APIs, must be after middleware
app.use(Paths.Base, apiRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (Env.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
    res.status(status).json({ error: err.message });
  }
  return next(err);
});

export default app;
