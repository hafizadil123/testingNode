/* eslint-disable linebreak-style */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import morgan from 'morgan';
import helmet from 'helmet';
import socket from 'socket.io';
import path from 'path';
import cron from 'node-cron';
import routes from './routes';
import Constants from './config/constants';
import { events } from '../app/lib/fetchEmailParser';
import { sendFeedbackEmailsToInvites, sendAutomatedEmailsToOrganizer } from '../app/lib/util';

const app = express();
// Helmet helps you secure your Express apps by setting various HTTP headers
// https://github.com/helmetjs/helmet
app.use(helmet());

// Enable CORS with various options
// https://github.com/expressjs/cors
app.use(cors());

// Request logger
// https://github.com/expressjs/morgan
if (!Constants.envs.test) {
	app.use(morgan('dev'));
}

// Parse incoming request bodies
// https://github.com/expressjs/body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Lets you use HTTP verbs such as PUT or DELETE
// https://github.com/expressjs/method-override
app.use(methodOverride());

// Mount public routes
// app.use('/public', express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use(Constants.apiPrefix, routes);
cron.schedule('* * * * *', () => {
	events();
	sendFeedbackEmailsToInvites();
});

cron.schedule('00 00 00 * * *', () => {
	sendAutomatedEmailsToOrganizer();
});
let server = app.listen(Constants.port, () => {
	// eslint-disable-next-line no-console
	console.log(`
    Port: ${Constants.port}
    Env: ${app.get('env')}
  `);
});

//  create socket server
let io = socket(server);

io.on('connection', (socket) => {
	// eslint-disable-next-line no-console
	console.log('connected with id: --', socket.id);
});

export default app;
