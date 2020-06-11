/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable max-len */
import nodemailer from 'nodemailer';
import { organizerFeedbackSchedulerEmailTemplate, reigstrationEmailTemplate, feedbackEmailTemplate, forgotPasswordTemplate, feedbackOrganizerEmailTemplate } from './emails';
import User from '../models/user.js';
import Invites from '../models/invites';
import Meeting from '../models/meetings';
import dateFormat from 'dateformat';
import path from 'path';
import multer from 'multer';
import imaps from 'imap-simple';
import moment from 'moment';
import ical from 'node-ical';

let config = {
	imap: {
		// user: 'havea@goodmeeting.today',
		// password: 'S4v3T1m3',
		user: 'myguardiansixtesting@gmail.com',
		password: 'myguardiansix6',
		host: 'imap.gmail.com',
		port: 993,
		tls: true,
		tlsOptions: { rejectUnauthorized: false },
	},
};

export const getAttachment = async() => {
	try {
		const connection = await imaps.connect(config);
		const inbox = await connection.openBox('INBOX');
		let searchCriteria = ['UNSEEN'];
		let fetchOptions = {
			bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
			struct: true,
			markSeen: true,
		};

		// retrieve only the headers of the messages
		const messages = await connection.search(searchCriteria, fetchOptions);
		let attachments = [];

		messages.forEach((message) => {
			let parts = imaps.getParts(message.attributes.struct);
			attachments = attachments.concat(
				parts
					.filter((part) => {
						return part.encoding && part.encoding.toUpperCase() === 'BASE64';
					})
					.map(async(part) => {
						// retrieve the attachments only of the messages with attachments
						const partData = await connection.getPartData(message, part);

						if (
							(part.subtype === 'ics' && part.type === 'application' && part.params !== null) ||
							(part.subtype === 'calendar' && part.type === 'text' && part.params !== null)
						) {
							return {
								filename: part.subtype,
								data: partData,
							};
						}
					})
			);
		});
		const attachmentArray = await Promise.all(attachments);
		// console.log('attachment array-----: ', attachmentArray);
		const filterAttachmentArray = attachmentArray.filter(Boolean);
		console.log('filter  array-----: ', filterAttachmentArray);
		let icsFileData = [];
		icsFileData = await filterAttachmentArray.map(async(file) => {
			// console.log('file: --', file);
			let buff = Buffer.from(file.data, 'base64');
			// console.log('buff: --', buff);
			let text = await buff.toString('ascii');
			// console.log('text: --', text);
			const data = await ical.parseICS(text);
			// console.log('data: --', data);
			const objectKeys = Object.values(data);
			// console.log('objectKeys: --', objectKeys);
			const filterObj =
				objectKeys.length === 1 || objectKeys[0].type === 'VEVENT' ? objectKeys[0] : objectKeys[1];
			// console.log('filterObj: --', filterObj);
			const desiredObj = await {
				subject: filterObj.summary.val ? filterObj.summary.val : filterObj.summary,
				// description: filterObj.description.val ? filterObj.description.val : filterObj.description,
				dateStart: moment(filterObj.start).format('YYYY-MM-DDTHH:mm:ss\\Z'),
				dateEnd: moment(filterObj.end).format('YYYY-MM-DDTHH:mm:ss\\Z'),
				organizer: filterObj.organizer.params.EMAIL
					? filterObj.organizer.params.EMAIL
					: filterObj.organizer.val.split('mailto:').join(''),
				invites:
					filterObj.attendee.length === undefined
						? filterObj.attendee.params.EMAIL
							? filterObj.attendee.params.EMAIL
							: filterObj.attendee.val.split('mailto:').join('')
						: filterObj.attendee.map(
								(invite) =>
									invite.params.EMAIL ? invite.params.EMAIL : invite.val.split('mailto:').join('')
							),
				status: filterObj.status,
				uId: filterObj.uid,
				// location: filterObj.location.val ? filterObj.location.val : filterObj.location
			};
			// console.log('obj: 0-----', desiredObj);
			icsFileData.push(desiredObj);
		});
		// const icsFileDataArray = await Promise.all(icsFileData);
		console.log('icsFileData: ---', await icsFileData);
		return await icsFileData;
	} catch (e) {
		console.log('Error');
	}
};

export const sendRegistrationEmail = async(sendTo) => {
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const message = {
		from: 'havea@goodmeeting.today', // Sender address
		to: sendTo, // List of recipients
		subject: 'Welcome In Good Meeting', // Subject line
		html: reigstrationEmailTemplate,
	};
	transport.sendMail(message, function(err, info) {
		if (err) {
			return err.json({ message: '' });
		} else {
			return info.json({ message: 'Registration email has been sent please verify!' });
		}
	});
};

export const feedbackOrganizerSchedulerEmail = async(sendTo, sub) => {
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const message = {
		from: 'havea@goodmeeting.today', // Sender address
		to: sendTo, // List of recipients
		subject: `7 Days Time For Receiving Feedback Is Over!`, // Subject line
		html: organizerFeedbackSchedulerEmailTemplate(sub),
	};
	transport.sendMail(message, function(err, info) {
		if (err) {
			return err.json({ message: '' });
		} else {
			return info.json({ message: 'Meeting Feedback email has been sent to organizer!' });
		}
	});
};

export const feedbackOrganizerEmail = async(sendTo, sub) => {
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const message = {
		from: 'havea@goodmeeting.today', // Sender address
		to: sendTo, // List of recipients
		subject: `You Have A New Feedback On Your Meeting!`, // Subject line
		html: feedbackOrganizerEmailTemplate(sub),
	};
	transport.sendMail(message, function(err, info) {
		if (err) {
			return err.json({ message: '' });
		} else {
			return info.json({ message: 'Meeting Feedback email has been sent to organizer!' });
		}
	});
};

export const forgotPasswordEmail = async(user) => {
	const updateUrl = 'https://goodmeeting.today/update-password';
	const userId = user._id;
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const message = {
		from: 'havea@goodmeeting.today', // Sender address
		to: user.email, // List of recipients
		subject: 'Password Reset Request', // Subject line
		html: forgotPasswordTemplate(updateUrl, userId),
	};
	transport.sendMail(message, function(err, info) {
		if (err) {
			return err.json({ message: '' });
		} else {
			return info.json({ message: 'Reset Link has been mailed' });
		}
	});
};

export const findUserIdByEmail = async(email) => {
	const user = await User.findOne({ email });
	if (!user) {
		return false;
	}
	return user._id;
};
export const contactUsEmail = async(payload) => {
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const message = {
		from: payload.email, // Sender address
		to: 'havea@goodmeeting.today', // List of recipients
		subject: 'Inquiry Email from User', // Subject line
		html: `<h1>${payload.name}</h1> <br /> <h3>${payload.email}</h3> <br /> <h4>${payload.message}</h4>`,
	};
	console.log('from', message.from);
	transport.sendMail(message, function(err, info) {
		if (err) {
			console.log('Error', err);
		} else {
			console.log('Feedback Mail Sent');
		}
	});
};
const sendFeedbackMail = async(sendTo, inviteId, startDateTime, subject, fullName) => {
	let transport = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: 'havea@goodmeeting.today',
			pass: 'S4v3T1m3',
		},
	});
	const InviteeObject = await Invites.findOne({ _id: inviteId });
	const meetingId = InviteeObject.meetingId;
	const message = {
		from: 'havea@goodmeeting.today', // Sender address
		to: sendTo, // List of recipients
		subject: 'Good Meeting Feedbacks', // Subject line
		html: feedbackEmailTemplate(meetingId, sendTo, inviteId, fullName, startDateTime, subject),
	};

	transport.sendMail(message, function(err, info) {
		if (err) {
			console.log('Error', err);
		} else {
			console.log('Feedback Mail Sent');
		}
	});
};
export const sendFeedbackEmailsToInvites = async() => {
	const invites = await Invites.find({});
	let CurrentDate = new Date();
	let updatedCurrentDate = dateFormat(CurrentDate, 'dddd, mmmm dS, yyyy, h:MM:ss TT');
	// const todayData = updatedCurrentDate.split(',')[1].concat(updatedCurrentDate.split(',')[2]).concat(updatedCurrentDate.split(',')[3]);
	// console.log('invites: --', invites);
	invites.map(async(item) => {
		// console.log('invites: --', item);
		if (!item.isEmailSent) {
			console.log('inside isemail not true');
			await Meeting.findOne({ _id: item.meetingId }).populate('_user').exec((err, meeting) => {
				console.log('inside meeting');
				// const meetingData = meeting && meeting.dateEnd && meeting.dateEnd.split(',')[1].concat(meeting.dateEnd.split(',')[2]).concat(meeting.dateEnd.split(',')[3]);
				if (meeting && compareDates(meeting.endDatWithoutEncoding)) {
					console.log('sent from loal: --');
					let subject = meeting.subject[0] || 'Good Meetings';
					let startDateTime = meeting.dateStart;
					sendFeedbackMail(item.invitesEmail, item._id, startDateTime, subject, meeting._user.fullName);
					item.isEmailSent = true;
					item.save();
				} else {
					// console.log('Meeting time not end till yet data outside');
				}
			});
		}
	});
	console.log('Meeting time not end till yet outside');
};


export const sendAutomatedEmailsToOrganizer = async() => {
	const meetings = await Meeting.find({});
	let todayDate = new Date();
	meetings.map(async(meeting) => {
		const dateDiff = moment(todayDate).diff(meeting.endDatWithoutEncoding, 'days');
		if (dateDiff === 8) {
			await feedbackOrganizerSchedulerEmail(meeting.organizer, meeting.subject[0]);
			console.log('Automated Email Send!');
		}
	});
};

export const formatedDate = (unformatedDate) => {
	let year = unformatedDate.substring(0, 4);
	let month = unformatedDate.substring(4, 6);
	let day = unformatedDate.substring(6, 8);
	let hour = unformatedDate.substring(9, 11);
	let min = unformatedDate.substring(11, 13);
	let sec = unformatedDate.substring(13, 15);
	const eventDate = new Date(year + '-' + month + '-' + day + ':' + ' ' + hour + ':' + min + ':' + sec);
	return eventDate;
};

export const compareDates = (meetingDate = '') => {
	const todayDat = new Date();
	console.log('curr date', todayDat);
	console.log('meeting old date: --', meetingDate);
	const meetingDateUpdated = new Date(meetingDate);
	console.log('meeting end date: --', meetingDateUpdated);
	const currentDate = todayDat;
	if (currentDate > meetingDateUpdated) {
		return true;
	} else {
		return false;
	}
};

export const uploadImages = () => {
	let storage = multer.diskStorage({
		destination: function(req, file, cb) {
			cb(null, path.join(__dirname, './upload/'));
		},
		filename: function(req, file, cb) {
			cb(null, file.fieldname + '-' + Date.now() + '.jpg');
		},
	});
	const upload = multer({ storage: storage }).single('avatar');
	return upload;
};
