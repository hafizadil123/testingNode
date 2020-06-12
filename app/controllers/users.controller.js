/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-spread */
import BaseController from './base.controller';
import User from '../models/user';
import Meeting from '../models/meetings';
import Invite from '../models/invites';
import Feedback from '../models/feedback';
import QuestionAnswers from '../models/questionAnswers';
import _ from 'lodash';
import moment from 'moment';
import ContactUsModel from '../models/contactUs';
const path = require('path');
import { sendRegistrationEmail, forgotPasswordEmail, contactUsEmail } from '../lib/util';
import { uploadImages } from '../lib/util';
class UsersController extends BaseController {
	whitelist = ['firstname', 'lastname', 'email', 'password', 'fullName', 'message', 'name', 'avatar'];

	_populate = async(req, res, next) => {
		const { body: { email } } = req;
		try {
			const user = await User.findOne({ email });
			if (!user) {
				next();
				res.status(404).json({ message: 'user is not exist!' });
			}

			req.user = user;
			next();
		} catch (err) {
			next(err);
		}
	};

	search = async(_req, res, next) => {
		try {
			// @TODO Add pagination
			res.json(await User.find());
		} catch (err) {
			next(err);
		}
	};

	fetch = (req, res) => {
		const user = req.user || req.currentUser;

		if (!user) {
			return res.sendStatus(404);
		}

		res.json(user);
	};

	create = async(req, res, next) => {
		const params = this.filterParams(req.body, this.whitelist);
		try {
			const user = await User.findone({ email: req.body.email });
			if (user) {
				return res.status(400).json({
					message: 'User already exist!',
				});
			}
			let newUser = new User({
				...params,
				provider: 'local',
			});
			const savedUser = await newUser.save();
			const token = savedUser.generateToken();
			await sendRegistrationEmail(params.email);
			return res.status(201).json({
				token,
				userId: savedUser._id,
				message: 'Your account is created successfully!',
				name: savedUser.fullName,
				userEmail: savedUser.email,
			});
		} catch (err) {
			err.status = 400;
			next(err);
		}
	};

	contactUs = async(req, res, next) => {
		const filteredParams = this.filterParams(req.body, this.whitelist);
		await contactUsEmail(filteredParams);
		let Inquery = new ContactUsModel({
			...filteredParams,
		});
		await Inquery.save();
		res.status(201).json({ messageResponse: 'your query has been submitted, Admin will come back shortly!' });
	};
	// Get All ContactUs By Admin (Admin Specific Function)
	getAllContactUs = async(req, res, next) => {
		const contacts = await ContactUsModel.find({});
		if (!contacts) {
			return res.status(400).json({ message: 'no contactUs found!' });
		}

		return res.status(200).json({ message: 'success', contactUs: contacts });
	};

	// Get All ContactUs By Admin (Admin Specific Function)
	changeContactUsStatus = async(req, res, next) => {
		const { contactId } = req.body;
		const contact = await ContactUsModel.findOneAndUpdate(
			{ _id: contactId },
			{ $set: { status: 'resolved' } },
			{ new: true }
		);
		if (!contact) {
			return res.status(400).json({ message: 'no contactUs found!' });
		}
		const contacts = await ContactUsModel.find({});
		return res.status(200).json({ message: 'success', contactUs: contacts });
	};

	getProfile = async(req, res, next) => {
		const userId = req.query.userId;
		const user = await User.findById(userId);
		res.json({ user });
	};

	// Get Users Card Data By Admin (Admin Specific Function)
	getUsersCardData = async(req, res, next) => {
		const tadayDate = new Date();
		const compDate = moment(tadayDate).subtract('7', 'days');

		const thisWeekUsers = await User.find({
			$and: [{ createdAt: { $gte: new Date(compDate), $lte: new Date(tadayDate) } }, { role: { $ne: 'admin' } }],
		}).count();
		const totalUsers = await User.find({ role: { $ne: 'admin' } }).count();
		const responseObj = {
			thisWeekUsers: thisWeekUsers,
			totalUsers: totalUsers,
		};

		return res.status(200).json({ message: 'success', users: responseObj });
	};

	// Get All Users By Admin (Admin Specific Function)
	getUsers = async(req, res, next) => {
		const users = await User.find({ role: { $ne: 'admin' } });
		if (!users) {
			return res.status(400).json({ message: 'no user found!' });
		}

		const usersResult = await this.getMeetingCount(users, res);
		const promisifyResult = Promise.all(usersResult);
		const usersData = await promisifyResult;
		return res.status(200).json({ message: 'success', users: usersData });
	};

	getMeetingCount = (users, res) => {
		return users.map(async(data) => {
			const meeting = await Meeting.find({ _user: data._id }).select('_id');
			const invite = await Invite.find({ meetingId: { $in: meeting } }).count();
			const inviteeWithFeedback = await Invite.find({
				$and: [{ meetingId: { $in: meeting } }, { isFeedbackGiven: true }],
			}).count();
			const meetingAvgResult = await this.getMeetingAvg(meeting, res);
			const promisifyResult = Promise.all(meetingAvgResult);
			const awaitResultArray = await promisifyResult;
			const obj = {
				_id: data._id,
				fullName: data.fullName,
				email: data.email,
				joinDate: moment(data.createdAt).format('LL'),
				numberOfMeetings: meeting.length,
				inviteesCount: invite,
				inviteesResponse:
					inviteeWithFeedback === 0 ? inviteeWithFeedback : Math.trunc(inviteeWithFeedback / invite * 100),
				feedbackMeetings:
					meeting.length === 0 ? meeting.length : Math.trunc(inviteeWithFeedback / meeting.length * 100),
				avg:
					meeting.length === 0
						? _.sum(awaitResultArray)
						: Math.trunc(_.sum(awaitResultArray) / meeting.length),
			};
			return obj;
		});
	};

	getMeetingAvg = (meeting, res) => {
		return meeting.map(async(data) => {
			const meetings = await Meeting.findById({ _id: data._id });
			let result;
			if (!meetings) {
				return res.status(400).json({ message: 'no meeting found!' });
			}
			const { subject, invites, dateEnd } = meetings;
			const members = invites.split(',').length;
			const getAnswerArray = await QuestionAnswers.find({});
			getAnswerArray.map((item) => item.answer);
			const feedback = await Feedback.find({ meetingId: data._id });
			// console.log(feedback);
			const gooMeeting = feedback.filter((item) => item.isGood === true);
			const badMeeting = feedback.filter((item) => item.isGood === false);
			const totalFeedback = feedback.length;
			const noResponse = members - totalFeedback;
			result = feedback.map((el) => {
				return el.feedbackResults.map((item) => item.answerId);
			});
			let mergedResults = [].concat.apply([], result);
			const getAns = getAnswerArray.map((item) => item.answers);
			let getAnsMerged = [].concat.apply([], getAns);
			const matchedResults = mergedResults.map((item) => getAnsMerged.filter((el) => el.id == item));
			let removeArraySymbol = [].concat.apply([], matchedResults);
			let total =
				removeArraySymbol.length > 0
					? removeArraySymbol.reduce(function(accumulator, currentValue) {
							return accumulator + currentValue.weightage;
						}, 0)
					: 0;
			// count total and devide to total
			const avgMeetingScore = total !== 0 ? Math.trunc(total / removeArraySymbol.length) : 0;
			return avgMeetingScore;
		});
	};

	update = async(req, res, next) => {
		const newAttributes = this.filterParams(req.body, this.whitelist);
		const updatedUser = Object.assign({}, req.currentUser, newAttributes);
		const query = req.query.userId !== 'undefined' ? req.query.userId : '';
		const user = await User.findById({ _id: query });
		user.password = updatedUser.password;
		try {
			if (!user) {
				return res.status(500).json({ message: 'user does not exist!' });
			}
			await user.save();
			res.status(200).json({ message: 'password has been updated' });
		} catch (err) {
			next(err);
		}
	};

	delete = async(req, res, next) => {
		if (!req.currentUser) {
			return res.sendStatus(403);
		}

		try {
			await req.currentUser.remove();
			res.sendStatus(204);
		} catch (err) {
			next(err);
		}
	};
	forgotPassword = async(req, res, next) => {
		try {
			const { body: { email } } = req;
			const user = await User.findOne({ email });
			if (!user) {
				next();
				res.status(404).json({ message: 'user is not exist!' });
			}

			await forgotPasswordEmail(user);
			res.status(200).json({ message: 'please check your email, password reset link has been mailed' });
		} catch (err) {
			err.status = 400;
			next(err);
		}
	};

	getProfile = async(req, res, next) => {
		const userId = req.query.userId;
		const user = await User.findById(userId);
		res.json({ user });
	};

	update = async(req, res, next) => {
		const newAttributes = this.filterParams(req.body, this.whitelist);
		const updatedUser = Object.assign({}, req.currentUser, newAttributes);
		const query = req.query.userId !== 'undefined' ? req.query.userId : '';
		const user = await User.findById({ _id: query });
		user.password = updatedUser.password;
		try {
			if (!user) {
				return res.status(500).json({ message: 'user does not exist!' });
			}
			await user.save();
			res.status(200).json({ message: 'password has been updated' });
		} catch (err) {
			next(err);
		}
	};

	delete = async(req, res, next) => {
		if (!req.currentUser) {
			return res.sendStatus(403);
		}

		try {
			await req.currentUser.remove();
			res.sendStatus(204);
		} catch (err) {
			next(err);
		}
	};
	forgotPassword = async(req, res, next) => {
		try {
			const { body: { email } } = req;
			const user = await User.findOne({ email });
			if (!user) {
				next();
				res.status(404).json({ message: 'user is not exist!' });
			}

			await forgotPasswordEmail(user);
			res.status(200).json({ message: 'please check your email, password reset link has been mailed' });
		} catch (err) {
			err.status = 400;
			next(err);
		}
	};
}

export default new UsersController();
