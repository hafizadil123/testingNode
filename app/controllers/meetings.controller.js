/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
/* eslint-disable prefer-spread */
import BaseController from './base.controller';
import Meeting from '../models/meetings';
import User from '../models/user';
import Invite from '../models/invites';
import Feedback from '../models/feedback';
import QuestionAnswers from '../models/questionAnswers';
import moment from 'moment';
class MeetingsController extends BaseController {
	whitelist = ['text', 'from', 'to'];

	// Middleware to populate post based on url param
	_populate = async(req, res, next) => {
		const { meetingId } = req.query;
		let result;
		try {
			const meetings = await Meeting.findById(meetingId);

			if (!meetings) {
				const err = new Error('meeting not found.');
				err.status = 404;
				return next(err);
			}
			const { subject, invites, dateEnd } = meetings;
			const members = invites.split(',').length;
			const getAnswerArray = await QuestionAnswers.find({});
			getAnswerArray.map((item) => item.answer);
			const feedback = await Feedback.find({ meetingId });
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
			// res.json(mergedResults);
			res.json({
				subject,
				members,
				dateEnd,
				totalFeedback,
				noResponse,
				avgMeetingScore,
				goodMeeting: gooMeeting.length,
				badMeeting: badMeeting.length,
			});
		} catch (err) {
			err.status = err.name === 'CastError' ? 404 : 500;
			next(err);
		}
	};

	// Get Meetings Card Data By Admin (Admin Specific Function)
	getInviteeDetail = async(req, res, next) => {
		const { meetingId } = req.query;

		const invitees = await Invite.find({ meetingId: meetingId });
		const score = await this.getMeetingAvg(meetingId, res);
		if (!invitees) {
			return res.status(400).json({ message: 'no invitees found!' });
		}
		const dataArr = [];
		invitees.map((item) => {
			const obj = {
				_id: item._id,
				invitesEmail: item.invitesEmail,
				date: moment(item.createdAt).format('LL'),
				score: score,
				isFeedbackGiven: item.isFeedbackGiven,
			};
			return dataArr.push(obj);
		});
		return res.status(200).json({ message: 'success', invitees: dataArr });
	};
	// get invitee detail helper function
	getMeetingAvg = async(meetingId, res) => {
		const meetings = await Meeting.findById({ _id: meetingId });
		let result;
		if (!meetings) {
			return res.status(400).json({ message: 'no meeting found!' });
		}
		const { subject, invites, dateEnd } = meetings;
		const members = invites.split(',').length;
		const getAnswerArray = await QuestionAnswers.find({});
		getAnswerArray.map((item) => item.answer);
		const feedback = await Feedback.find({ meetingId: meetingId });
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
	};

	// Get Meetings Card Data By Admin (Admin Specific Function)
	getMeetingsCardData = async(req, res, next) => {
		const tadayDate = new Date();
		const compDate = moment(tadayDate).subtract('7', 'days');

		const thisWeekMeetings = await Meeting.find({
			$and: [{ createdAt: { $gte: new Date(compDate), $lte: new Date(tadayDate) } }],
		}).count();
		const totalMeetings = await Meeting.find({}).count();
		const totalFeedbacks = await Feedback.find({}).count();
		const totalInvitees = await Invite.find({}).count();
		// if (!totalMeetings || !totalFeedbacks || !totalInvitees) {
		// 	return res.status(400).json({ message: 'not found!' });
		// }
		const responseObj = {
			thisWeekMeetings: thisWeekMeetings,
			totalMeetings: totalMeetings,
			totalFeedbacks: totalFeedbacks,
			totalInvitees: totalInvitees,
		};

		return res.status(200).json({ message: 'success', meetings: responseObj });
	};


	getUserBarStats = async(req, res, next) => {
		const { userId } = req.params;
		const { from, to } = req.body;
		try {
			const user = await User.findById({ _id: userId });
			if (!user) {
				return res.status(400).json({ message: 'no user found!' });
			}
			if ( from && to ) {
				const meetings = await Meeting.find({ $and: [{ createdAt: { $gte: new Date(from), $lte: new Date(to) } }, { _user: userId }] });
				if (!meetings) {
					return res.status(400).json({ message: 'no meeting found!' });
				}
				const scoreArray = Promise.all(meetings.map(async(meeting)=> await this.getMeetingAvgForBarStats(meeting._id, meeting.invites)));
				const scores = await scoreArray;
				return res.json({ msg: 'success', scores });
			}
			const meetings = await Meeting.find({ _user: userId });
			if (!meetings) {
				return res.status(400).json({ message: 'no meeting found!' });
			}
			const scoreArray = Promise.all(meetings.map(async(meeting)=> await this.getMeetingAvgForBarStats(meeting._id, meeting.invites)));
			const scores = await scoreArray;
			return res.json({ msg: 'success', scores });
		} catch (err) {
			next(err);
		}
	};

	getMeetingAvgForBarStats = async(meetingId, invites) => {
		let result;
		const members = invites.split(',').length;
		const getAnswerArray = await QuestionAnswers.find({});
		getAnswerArray.map((item) => item.answer);
		const feedback = await Feedback.find({ meetingId: meetingId });
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
	};

	search = async(_req, res, next) => {
		try {
			const posts = await Meeting.find({}).populate({
				path: '_user',
				select: '-posts -role',
			});

			res.json(posts);
		} catch (err) {
			next(err);
		}
	};

	/**
   * req.post is populated by middleware in routes.js
   */

	fetch = async(req, res, _next) => {
		const userId = req.query.userId;
		const userMeetings = await Meeting.find({ _user: userId }).populate('_user').sort({ createdAt: -1 });
		// const members = userMeetings.map((item) => item.invites.split(',').length);
     	//  userMeetings me sari ek user ki meetings mil rahi hain... meny us meeting kitny members r kitny bndo ny feedback
		const getMembersArray = userMeetings.map(async(item) => await this.getMembers(item._id));
		const result = Promise.all(getMembersArray);
		result.then((data) => {
			const final = this.getData(userMeetings, data);
			res.json(final);
		});
	};

	getData = (userMeetings, memberData) => {
		return userMeetings.map((meeting, index) => {
			return {
				meeting,
				...memberData[index],
			};
		});
	};

	// Get All Meetings By Admin (Admin Specific Function)
	getMeetings = async(req, res, next) => {
		const meetings = await Meeting.find({});
		if (!meetings) {
			return res.status(400).json({ message: 'no meeting found!' });
		}
		const result = await this.getFeedbackCount(meetings);
		const refineResult = Promise.all(result);
		const meetingsData = await refineResult;
		return res.status(200).json({ message: 'success', meetings: meetingsData });
	};

	// Get meetings helper function

	getFeedbackCount = (meetings) => {
		return meetings.map(async(data) => {
			const invite = await Invite.find({ $and: [{ isFeedbackGiven: true }, { meetingId: data._id }] }).count();
			const obj = {
				_id: data._id,
				subject: data.subject,
				organizer: data.organizer,
				// date: moment(data.createdAt).format('LL'),
				dateEnd: data.dateEnd,
				inviteesCount: data.invites.split(',').length,
				feedbacksCount: invite,
			};
			return obj;
		});
	};

	// Get Meetings Detail By Admin (Admin Specific Function)

	getMeetingDetail = async(req, res, next) => {
		const { meetingId } = req.query;
		let result;
		try {
			const meetings = await Meeting.findById(meetingId);

			if (!meetings) {
				return res.status(400).json({ message: 'no meeting found!' });
			}
			const { subject, invites, dateEnd } = meetings;
			const members = invites.split(',').length;
			const getAnswerArray = await QuestionAnswers.find({});
			getAnswerArray.map((item) => item.answer);
			const feedback = await Feedback.find({ meetingId });
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
			// res.json(mergedResults);
			const responseObj = {
				subject: subject[0],
				dateEnd: dateEnd,
				avgMeetingScore: avgMeetingScore,
				totalFeedback: totalFeedback,
				noResponse: noResponse,
				members: members,
				goodMeeting: gooMeeting.length,
				badMeeting: badMeeting.length,
			};
			return res.status(200).json({ message: 'success', meetingDetail: responseObj });
			// res.json({
			// 	subject,
			// 	members,
			// 	dateEnd,
			// 	totalFeedback,
			// 	noResponse,
			// 	avgMeetingScore,
			// 	goodMeeting: gooMeeting.length,
			// 	badMeeting: badMeeting.length
			// });
		} catch (err) {
			err.status = err.name === 'CastError' ? 404 : 500;
			next(err);
		}
	};

	getMembers = async(id) => {
		const meetingId = id;
		// const meetingId = '5dffad06a9d36afc546e5f6d';
		const members = await Meeting.findOne({ _id: meetingId });
		const memberCount = members.invites.split(',');
		const feedback = await Feedback.find({ meetingId: meetingId });
		const membersFeedback = {
			members: memberCount.filter((item) => item).length,
			feebackCount: feedback.length,
		};
		return membersFeedback;
	};

	getFeedbacks = async() => {};

	/**
   * req.user is populated by middleware in routes.js
   */

	create = async(req, res, next) => {
		const params = this.filterParams(req.body, this.whitelist);

		const post = new Meeting({
			...params,
			_user: req.currentUser._id,
		});

		try {
			res.status(201).json(await post.save());
		} catch (err) {
			next(err);
		}
	};

	delete = async(req, res, next) => {
		/**
     * Ensure the user attempting to delete the post owns the post
     *
     * ~~ toString() converts objectIds to normal strings
     */
		if (req.post._user.toString() === req.currentUser._id.toString()) {
			try {
				await req.post.remove();
				res.sendStatus(204);
			} catch (err) {
				next(err);
			}
		} else {
			res.sendStatus(403);
		}
	};
}

export default new MeetingsController();
