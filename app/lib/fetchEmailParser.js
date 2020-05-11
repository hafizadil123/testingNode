/* eslint-disable no-console */
// import Imap from 'imap';
// Imap.inspect = require('util').inspect;
// let MailParser = require('mailparser').MailParser;
// const simpleParser = require('mailparser').simpleParser;
let Promise = require('bluebird');
const dateFormat = require('dateformat');
Promise.longStackTraces();
//import ical from 'cal-parser';
import { findUserIdByEmail, getAttachment } from './util.js';
import User from '../models/user';
import { formatedDate } from './util';
import Meetings from '../models/meetings';
import Invites from '../models/invites.js';
import moment from 'moment';

let imapConfig = {
	user: 'havea@goodmeeting.today',
	password: 'S4v3T1m3',
	host: 'imap.gmail.com',
	port: 993,
	tls: true
};

export const events = async (req, res) => {
	/////////////////////////////----My Code Starts-----///////////////////////////////////////////
	const emailFetchedData = await getAttachment();
	console.log('data: ---', await emailFetchedData);

	//emailFetchedData.length === 0 ||
	emailFetchedData === 'Error' || emailFetchedData === undefined || emailFetchedData === 'undefined'
		? console.log('No Email Found')
		: emailFetchedData.map(async (data) => {
				if ((await data) !== undefined) {
					const userId = await findUserId(data.organizer);
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
							dateStart: moment(data.dateStart).utc().format('dddd, MMMM Do, YYYY, h:mm:ss a'),
							dateEnd: moment(data.dateEnd).utc().format('dddd, MMMM Do, YYYY, h:mm:ss a'),
							//location: data.location,
							endDatWithoutEncoding: data.dateEnd,
							status: data.status,
							uId: data.uId,
							_user: userId
						};
						const updateMeetings = new Meetings({
							...mapData
						});
						updateDataInModels(updateMeetings);
					}
				}
			});
};
const findUserId = (item) => {
	const id = findUserIdByEmail(item);
	return id;
};
const updateDataInModels = async (data) => {
	// remove cancelled meeting if it exist
	const deletMeeting = await Meetings.findOneAndDelete({ uId: data.uId });
	if (deletMeeting) {
		console.log('--if already exist--');
		await Invites.remove({ uId: data.uId });
		return;
	} else {
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
					uId: data.uId
				};
				const updateInvites = new Invites({
					...mapInvitesData
				});
				updateInvites.save();
			} else {
				console.log('comma exist');
			}
		});
	}
};
