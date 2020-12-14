/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
// import Imap from 'imap';
// Imap.inspect = require('util').inspect;
// let MailParser = require('mailparser').MailParser;
// const simpleParser = require('mailparser').simpleParser;
let Promise = require('bluebird');
const dateFormat = require('dateformat');
Promise.longStackTraces();
// import ical from 'cal-parser';
import { findUserIdByEmail, getAttachment, sendEmailToNotRegisteredUser } from './util.js';
import User from '../models/user';
import { formatedDate } from './util';
import Meetings from '../models/meetings';
import Invites from '../models/invites.js';
import moment from 'moment';
import _ from 'lodash';

let imapConfig = {
	user: 'havea@goodmeeting.today',
	password: 'S4v3T1m3',
	host: 'imap.gmail.com',
	port: 993,
	tls: true,
};

export const events = async(req, res) => {
	// ///////////////////////////----My Code Starts-----///////////////////////////////////////////
	const emailFetchedData = await getAttachment();
	console.log('data: ---', await emailFetchedData);

	// emailFetchedData.length === 0 ||
	emailFetchedData === 'Error' || emailFetchedData === undefined || emailFetchedData === 'undefined'
		? console.log('No Email Found')
		: emailFetchedData.map(async(data) => {
				if ((await data) !== undefined) {
					const userId = await findUserId(data.organizer);
					// if not exist just send email to register at our platform
					if (userId) {
						const mapData = {
							subject: data.subject,
							organizer: data.organizer,
							invites:
								typeof data.invites === 'string'
									? data.invites
									: data.invites
											.filter(
												(invite) =>
													invite !== data.organizer && invite !== 'havea@goodmeeting.today'
											)
											.join(','),
							dateStart: moment(data.dateStart).utc().format('dddd, MMMM Do, YYYY, h:mm a'),
							dateEnd: moment(data.dateEnd).utc().format('dddd, MMMM Do, YYYY, h:mm a'),
							// location: data.location,
							endDatWithoutEncoding: data.dateEnd,
							startDatWithoutEncoding: data.dateStart,
							status: data.status,
							uId: data.uId,
							_user: userId,
						};
						const updateMeetings = new Meetings({
							...mapData,
						});
						updateDataInModels(updateMeetings);
					}else {
						console.log('send email if organizer not exist');
						sendEmailToNotRegisteredUser(data.organizer);
					}
				}
			});
};
const findUserId = (item) => {
	const id = findUserIdByEmail(item);
	return id;
};
const updateDataInModels = async(data) => {
	// remove cancelled meeting if it exist
	const findMeeting = await Meetings.findOne({ uId: data.uId });
	const todayDate = new Date();
	if (findMeeting) {
		console.log('--if already exist--');
		console.log('find meeting: --:', findMeeting);
		console.log('coming meeting: --:', data);
		const dbObject = {
			subject: findMeeting.subject[0],
			uId: findMeeting.uId,
			endDatWithoutEncoding: findMeeting.endDatWithoutEncoding,
			organizer: findMeeting.organizer,
			invites: findMeeting.invites,
			dateStart: findMeeting.dateStart,
			dateEnd: findMeeting.dateEnd,
		};
		const comingObject = {
			subject: data.subject[0],
			uId: data.uId,
			endDatWithoutEncoding: data.endDatWithoutEncoding,
			organizer: data.organizer,
			invites: data.invites,
			dateStart: data.dateStart,
			dateEnd: data.dateEnd,
		};
		const diff = _.omitBy(comingObject, function(v, k) {
			console.log('k,v,last[k] = ' + k + ',' + v + ',' + dbObject[k]);
			return dbObject[k] === v;
		});
		if (_.isEmpty(diff)) {
			console.log('No difference between two object:');
			await Meetings.findOneAndDelete({ uId: data.uId });
			await Invites.remove({ uId: data.uId });
			return;
		} else if (findMeeting.endDatWithoutEncoding > data.dateEnd) {
			console.log('There is difference between two object:');
			console.log('Here is difference: --', diff);
			if (diff.invites) {
				console.log('difference in invites: --', diff.invites);
				const dbInvites = findMeeting.invites.split(',');
				const diffInvites = diff.invites.split(',');

				console.log('dbInvites: ---', dbInvites);
				console.log('diffInvites: ---', diffInvites);
				const bothInvitesDiff = _.difference(diffInvites, dbInvites);
				console.log('bothInvitesDiff: ---', bothInvitesDiff);
				await Meetings.findOneAndUpdate({ uId: data.uId }, { $set: diff }, { new: true });
				bothInvitesDiff.map(async(item) => {
					if (item) {
						const updateInvites = new Invites({
							invitesEmail: item,
							meetingId: findMeeting._id,
							uId: data.uId,
						});
						await updateInvites.save();
					}
				});
				return;
			}else {
				console.log('No difference in invites so update the meeting collection: --');
				await Meetings.findOneAndUpdate({ uId: data.uId }, { $set: diff }, { new: true });
				return;
			}
		}
	} else {
		const meet = await Meetings.findOne({ uId: data.uId });
		if (!meet) {
			console.log('--else not exist--');
		const meetingsAdded = await data.save();
		const invitesArray = meetingsAdded.invites.split(',');
		//  const invitesArray = 'ahafiz167@gmail.com, saeed@thirtynorth.dev';
		// if(!invitesArray.length) return null;
		const updatedArray = invitesArray.map((item) => item);
		updatedArray.map((item) => {
			if (item) {
				const mapInvitesData = {
					invitesEmail: item,
					meetingId: meetingsAdded._id,
					uId: data.uId,
				};
				const updateInvites = new Invites({
					...mapInvitesData,
				});
				updateInvites.save();
			} else {
				console.log('comma exist');
			}
		});
		}else {
			console.log('--meeting exist--');
		}
	}
};
