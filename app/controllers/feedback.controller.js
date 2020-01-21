/* eslint-disable babel/new-cap */
  /* eslint-disable prefer-spread */
/* eslint-disable no-undef */
import BaseController from './base.controller';
import Feedback from '../models/feedback';
import Invites from '../models/invites';
import Meeting from '../models/meetings';
import QuestionAnswers from '../models/questionAnswers';
const mongoose = require('mongoose');

class FeedbackController extends BaseController {
  whitelist = [
    'text',
    'feedbackResults',
    'inviteName',
    'inviteeId',
    'isGood',
    'meetingId',
  ];

   // Middleware to populate post based on url param
  _populate = async(req, _res, next) => {
    const { id } = req.params;

    try {
      const post = await Feedback.findById(id);

      if (!post) {
        const err = new Error('Post not found.');
        err.status = 404;
        return next(err);
      }

      req.post = post;
      next();
    } catch(err) {
      err.status = err.name ==='CastError' ? 404 : 500;
      next(err);
    }
  }

  search = async(_req, res, next) => {
    try {
      const posts =
        await Feedback.find({})
                  .populate({ path: '_user', select: '-posts -role' });

      res.json(posts);
    } catch(err) {
      next(err);
    }
  }

  /**
   * req.post is populated by middleware in routes.js
   */

  fetch = (req, res) => {
    res.json(req.post);
  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create = async(req, res, next) => {
    const params = this.filterParams(req.body, this.whitelist);
    const isAlreadyExist = await Feedback.findOne({ inviteeId: req.body.inviteeId });
    if(isAlreadyExist) {
        return res.status(400).json({ message: 'you already submitted feedback of this meeting' });
    }
    const feedback = new Feedback({
      ...params,
    });

    try {
      await feedback.save();
     const inviteObject = await Invites.findById(req.body.inviteeId);
      inviteObject.isFeedbackGiven = true;
      await inviteObject.save();
      res.status(201).json({ message: 'Thank you, your feedback is submitted succesfully!' });
    } catch(err) {
      next(err);
    }
  }
  calculateValues = (userMeetings, getAnswerArray) => {
    let result = '';
    let avg = 0;
      userMeetings.map((item) => {
        Feedback.find({ meetingId: item._id }).exec(function(err, userMeetingFeedback) {
          if (userMeetingFeedback.length === 0) {
            return avg;
          }
          // this result contains all answers object of meeting for specific user,
        result = userMeetingFeedback.map((el) => {
        return el.feedbackResults.map((item) => item.answerId);
          });
          // make array flattened  [{id: 1}, {1id:2}} arrayname.reducer(a,b) => ({id: a.id + b.id }, 0)
          let mergedResults = [].concat.apply([], result);
          const getAns= getAnswerArray.map((item) => item.answers);
          let getAnsMerged = [].concat.apply([], getAns);
          const matchedResults= mergedResults.map((item) => getAnsMerged.filter((el) => el.id == item));
          let removeArraySymbol = [].concat.apply([], matchedResults || []);
          const total = removeArraySymbol.length > 0 ? removeArraySymbol.reduce((a, b) => ({ weightage: a.weightage + b.weightage }, 0)) : 0;
          // count total and devide to total
          avg = Math.trunc(
            total.weightage / removeArraySymbol.length
          );
          return avg;
          // return json response
        });
       });
  }

   getResult = async(res, positiveReviews, negativeReviews, meeting, userId) => {
    const getAnswerArray = await QuestionAnswers.find({});
    getAnswerArray.map((item) => item.answer);

    const userMeet = await Meeting.find({ _user: userId });
    const avg = this.calculateValues(userMeet, getAnswerArray);
    res.json({ positiveReviews: positiveReviews,
      negativeReviews: negativeReviews, avgScore: 3, totalMeeting: meeting });
  }


  feedbackStats = async(req, res, _next) => {
    const positiveReviews = await Feedback.find({ isGood: true });
    const negativeReviews = await Feedback.find({ isGood: false });
    const meeting = await Meeting.find({
      createdAt: {
        $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
    },
    });
    const userId = mongoose.Types.ObjectId(req.query.userId);
    // get user meetings with Id


    const avg = await Meeting.
    aggregate([
      { '$match': { '_user': userId } },
      {
          '$lookup': {
              'from': 'feedbacks',
              'let': { 'meeting_id': '$_id' },
              'pipeline': [
                  {
                      '$match': {
                          '$expr': {
                              '$eq': ['$meetingId', '$$meeting_id'],
                          },
                      },
                  },
                  { '$unwind': { 'path': '$feedbackResults' } },
                  {
                      '$project': {
                          'question_id': {
                              '$toObjectId': '$feedbackResults.questionId',
                          },
                          'answer_id': {
                              '$toObjectId': '$feedbackResults.answerId',
                          },
                          'isGood': '$isGood',
                      },
                  },
                  {
                      '$lookup': {
                          'from': 'questionanswers',
                          'localField': 'question_id',
                          'foreignField': '_id',
                          'as': 'qa_data',
                      },
                  },
                  { '$unwind': { 'path': '$qa_data' } },
                  {
                      '$project': {
                          'answer_data': {
                              '$filter': {
                                  input: '$qa_data.answers',
                                  as: 'item',
                                  cond: { $eq: ['$$item.id', '$answer_id'] },
                              },
                          },
                          'isGood': '$isGood',
                      },
                  },
                  { '$unwind': { 'path': '$answer_data' } },
                  {
                      '$group': {
                          '_id': '',
                          'weightage': { '$avg': '$answer_data.weightage' },
                          'overall_rating': {
                              '$addToSet': '$isGood',
                          },
                      },
                  },
              ],
              'as': 'feedback_data',
          },
      },
      {
          '$unwind': { 'path': '$feedback_data', 'preserveNullAndEmptyArrays': true },
      },
      {
          '$group': {
              '_id': '',
              'averageWeightage': { '$avg': '$feedback_data.weightage' },
              'overall_rating': { '$addToSet': '$feedback_data.overall_rating' },
              'total_meetings': { '$push': '$createdAt' },
          },
      },
      {
          '$project': {
              '_id': false,
              'averageWeightage': true,
              'overall_rating': true,
              'total_meetings': true,
          },
      },
      { '$unwind': { 'path': '$overall_rating' } },
      {
          '$project': {
              'averageWeightage': true,
              'totalMeetings': {
                  '$size': {
                      '$filter': {
                          'input': '$total_meetings',
                          'as': 'input',
                          'cond': { '$and': [{ '$gte': ['$$input', new Date(new Date() - 7 * 60 * 60 * 24 * 1000)] }] },
                      },
                  },
              },
              'positiveReviews': {
                  '$size': {
                      '$filter': {
                          'input': '$overall_rating',
                          'as': 'input',
                          'cond': { '$and': [{ '$eq': ['$$input', true] }] },
                      },
                  },
              },
              'negativeReviews': {
                  '$size': {
                      '$filter': {
                          'input': '$overall_rating',
                          'as': 'input',
                          'cond': { '$and': [{ '$eq': ['$$input', false] }] },
                      },
                  },
              },
          },
      },
      {
          '$group': {
              '_id': '$averageWeightage',
              'positiveReviews': { '$sum': '$positiveReviews' },
              'negativeReviews': { '$sum': '$negativeReviews' },
              'totalMeetings': { '$first': '$totalMeetings' },
          },
      },
      {
          '$project': {
              '_id': false,
              'averageWeightage': '$_id',
              'positiveReviews': true,
              'negativeReviews': true,
              'totalMeetings': true,
          },
      },
  ]);

  res.json({ positiveReviews: avg[0].positiveReviews,
    negativeReviews: avg[0].negativeReviews, avgScore: avg[0].averageWeightage.toFixed(0), totalMeeting: avg[0].totalMeetings });
  // this.getResult(res, positiveReviews.length, negativeReviews.length, meeting.length, userId);
  }
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
      } catch(err) {
        next(err);
      }
    } else {
      res.sendStatus(403);
    }
  }
}

export default new FeedbackController();
