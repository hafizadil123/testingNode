/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
/* eslint-disable babel/new-cap */
/* eslint-disable no-unused-vars */

import BaseController from './base.controller';
import Questions from '../models/questionAnswers';
import Feedback from '../models/feedback';
import Meeting from '../models/meetings';
import mongoose from 'mongoose';
import _ from 'lodash';
class QuestionsController extends BaseController {
	whitelist = ['text'];

	// Middleware to populate post based on url param
	_populate = async(req, res, next) => {
		const { meetingId } = req.query;

		try {
			const questionAnswers = await Questions.find({});
			const feedback = await Feedback.find({ meetingId });
			const obj = {};
			feedback.forEach((feedbackItem) =>
				feedbackItem.feedbackResults.forEach((feedbackResult) =>
					questionAnswers.forEach((questionItem) =>
						questionItem.answers.forEach((ansItem) => {
							if (feedbackResult.answerId == ansItem.id) {
								if (feedbackResult.answerId in obj) {
									obj[feedbackResult.answerId] = obj[feedbackResult.answerId] + 1;
								} else {
									obj[feedbackResult.answerId] = 1;
								}
							}
						})
					)
				)
			);
			questionAnswers.forEach((item) =>
				item.answers.forEach((answer) => {
					if (answer.id in obj) {
						answer['count'] = obj[answer.id];
					}
				})
			);

			questionAnswers.forEach((item) => {
				const sortedArray = _.sortBy(item.answers, 'weightage');
				item.answers = sortedArray;
			});

			res.json(questionAnswers);
		} catch (err) {
			err.status = err.name === 'CastError' ? 404 : 500;
			next(err);
		}
	};

	search = async(req, res, next) => {
		try {
			const posts = await Questions.find({}).populate({
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

	fetch = async(req, res) => {
		// const userId = "5e14c1ff2824c72182d0417e";
		// const userMeetings = await Meeting.find({ _user: userId });
		const questionAnswers = await Questions.find({});
		const feedback = await Feedback.find({});
		const obj = {};
		feedback.forEach((feedbackItem) =>
			feedbackItem.feedbackResults.forEach((feedbackResult) =>
				questionAnswers.forEach((questionItem) =>
					questionItem.answers.forEach((ansItem) => {
						if (feedbackResult.answerId == ansItem.id) {
							if (feedbackResult.answerId in obj) {
								obj[feedbackResult.answerId] = obj[feedbackResult.answerId] + 1;
							} else {
								obj[feedbackResult.answerId] = 1;
							}
						}
					})
				)
			)
		);
		questionAnswers.forEach((item) =>
			item.answers.forEach((answer) => {
				if (answer.id in obj) {
					answer['count'] = obj[answer.id];
				}
			})
		);

		questionAnswers.forEach((item) => {
			const sortedArray = _.sortBy(item.answers, 'weightage');
			item.answers = sortedArray;
		});
		res.json(questionAnswers);
	};
	/**
   * req.user is populated by middleware in routes.js
   */

	getSummary = async(req, res) => {
		const userId = mongoose.Types.ObjectId(req.query.userId);
		const summaryDeatils = await Meeting.aggregate([
			{ $match: { _user: userId } },
			{
				$lookup: {
					from: 'feedbacks',
					let: { meeting_id: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ['$meetingId', '$$meeting_id'],
								},
							},
						},
						{ $unwind: { path: '$feedbackResults' } },
						{
							$project: {
								question_id: {
									$toObjectId: '$feedbackResults.questionId',
								},
								answer_id: {
									$toObjectId: '$feedbackResults.answerId',
								},
							},
						},
						{
							$lookup: {
								from: 'questionanswers',
								localField: 'question_id',
								foreignField: '_id',
								as: 'qa_data',
							},
						},
						{ $unwind: { path: '$qa_data' } },
						{
							$project: {
								answer_data: {
									$filter: {
										input: '$qa_data.answers',
										as: 'item',
										cond: { $eq: ['$$item.id', '$answer_id'] },
									},
								},
							},
						},
						{ $unwind: { path: '$answer_data' } },
						{
							$group: {
								_id: '',
								weightage: { $avg: '$answer_data.weightage' },
							},
						},
					],
					as: 'feedback_data',
				},
			},
			{
				$unwind: { path: '$feedback_data', preserveNullAndEmptyArrays: true },
			},
			{
				$lookup: {
					from: 'feedbacks',
					localField: '_id',
					foreignField: 'meetingId',
					as: 'feedbacks',
				},
			},
			{
				$project: {
					weightage: '$feedback_data.weightage',
					providedFeedbacks: {
						$cond: {
							if: {
								$gt: [{ $size: '$feedbacks' }, 0],
							},
							then: { $size: '$feedbacks' },
							else: 0,
						},
					},
					noFeedbacks: {
						$cond: {
							if: {
								$gt: [{ $size: '$feedbacks' }, 0],
							},
							then: 0,
							else: 1,
						},
					},
				},
			},
			{
				$group: {
					_id: '',
					averageWeightage: { $avg: '$weightage' },
					providedFeedbacks: { $sum: '$providedFeedbacks' },
					noFeedbacks: { $sum: '$noFeedbacks' },
					totalMeetings: { $push: { _id: '$_id' } },
				},
			},
			{
				$project: {
					_id: false,
					averageWeightage: { $ifNull: ['$averageWeightage', 0] },
					providedFeedbacks: true,
					noFeedbacks: true,
					totalMeetings: { $size: '$totalMeetings' },
				},
			},
		]);
		if (summaryDeatils && summaryDeatils.length > 0) {
			res.json({
				noResponse: summaryDeatils[0].noFeedbacks,
				allMeetings: summaryDeatils[0].totalMeetings,
				allFeedback: summaryDeatils[0].providedFeedbacks,
				avgScore: summaryDeatils[0].averageWeightage,
			});
		} else {
			res.json({
				noResponse: 0,
				allMeetings: 0,
				allFeedback: 0,
				avgScore: 0,
			});
		}
	};
	create = async(req, res, next) => {
		const params = this.filterParams(req.body, this.whitelist);
		const object = {
			question: 'Did you stay on topic or did the meeting veer off course?',
			answers: [
				{
					id: new mongoose.Types.ObjectId(),
					answer: 'it was ok - we covered some of what we needed to',
					weightage: 60,
				},
				{
					id: new mongoose.Types.ObjectId(),
					answer: 'It started ok, but then changed\t',
					weightage: 40,
				},
				{
					id: new mongoose.Types.ObjectId(),
					answer: 'Yes, it totally changed direction',
					weightage: 20,
				},
				{
					id: new mongoose.Types.ObjectId(),
					answer: 'we covered what we needed to, with some diversion',
					weightage: 80,
				},
				{
					id: new mongoose.Types.ObjectId(),
					answer: 'We stayed totally on the subject',
					weightage: 100,
				},
			],
		};
		const post = new Questions({
			...object,
		});

		try {
			res.status(201).json(await post.save());
		} catch (err) {
			next(err);
		}
	};

	getStatsQuestion = async(req, res) => {
		const userId = mongoose.Types.ObjectId(req.query.userId);
		try {
			const result = await Questions.aggregate([
				{
					$lookup: {
						from: 'feedbacks',
						let: { question_id: '$_id' },
						pipeline: [
							{
								$unwind: { path: '$feedbackResults' },
							},
							{
								$project: {
									_id: false,
									answer_id: { $toObjectId: '$feedbackResults.answerId' },
									question_id: { $toObjectId: '$feedbackResults.questionId' },
									meeting_id: '$meetingId',
								},
							},
							{
								$lookup: {
									from: 'meetings',
									localField: 'meeting_id',
									foreignField: '_id',
									as: 'meetings',
								},
							},
							{
								$unwind: { path: '$meetings' },
							},
							{
								$match: {
									$expr: {
										$and: [
											{ $eq: ['$question_id', '$$question_id'] },
											{ $eq: ['$meetings._user', userId] },
										],
									},
								},
							},
						],
						as: 'feedbacks',
					},
				},
				{
					$unwind: { path: '$answers' },
				},
				{
					$project: {
						answerCount: {
							$size: {
								$filter: {
									input: '$feedbacks',
									as: 'feedback',
									cond: {
										$eq: ['$$feedback.answer_id', '$answers.id'],
									},
								},
							},
						},
						answer_id: '$answers.id',
						answerText: '$answers.answer',
						answerWeightage: '$answers.weightage',
						questionText: '$question',
					},
				},
				{
					$group: {
						_id: '$_id',
						questionText: { $first: '$questionText' },
						answers: {
							$push: {
								answerId: '$answer_id',
								answerText: '$answerText',
								answerCount: '$answerCount',
								weightage: '$answerWeightage',
							},
						},
						totalCount: { $sum: '$answerCount' },
						questionAnswered: { $push: { _id: '$_id' } },
					},
				},
				{
					$unwind: { path: '$answers' },
				},
				{
					$sort: {
						'answers.weightage': -1,
					},
				},
				{
					$group: {
						_id: '$_id',
						question: { $first: '$questionText' },
						answers: {
							$push: {
								id: '$answers.answerId',
								answer: '$answers.answerText',
								weightage: '$answers.weightage',
								count: '$answers.answerCount',
								percentage: {
									$cond: [
										{ $eq: ['$totalCount', 0] },
										0,
										{
											$multiply: [{ $divide: ['$answers.answerCount', '$totalCount'] }, 100],
										},
									],
								},
							},
						},
					},
				},
				{
					$sort: {
						'answers.weightage': -1,
					},
				},
			]);
			res.json(result);
		} catch (err) {
			// console.log('err', err);
		}

		// console.log('sdfjdsalkfjkldsajfldsakf', result);
		// if(result.length > 0) {
		//   res.json(result);
		// } else {
		//   const result = await this.fetch();
		//   res.json(result);
		// }
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

export default new QuestionsController();
