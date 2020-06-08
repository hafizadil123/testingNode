/* eslint-disable linebreak-style */
import mongoose from 'mongoose';
import Constants from './config/constants';

// Use native promises
mongoose.Promise = global.Promise;

// Connect to our mongo database;
mongoose.connect(Constants.mongo.uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (err) => {
	// eslint-disable-next-line no-console
	console.log('error', err.message);
});
