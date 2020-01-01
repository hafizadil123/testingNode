import BaseController from './base.controller';
import Meeting from '../models/meetings';
import Invite from '../models/invites';
import Feedback from '../models/feedback';
import QuestionAnswers from '../models/questionAnswers';
class MeetingsController extends BaseController {
  whitelist = ['text'];

  // Middleware to populate post based on url param
  _populate = async (req, res, next) => {
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
      const gooMeeting = feedback.map((item) => item.isGood === true);
      const badMeeting = feedback.map((item) => item.isGood === false);
      const totalFeedback = feedback.length;
      const noResponse = totalFeedback - members;
      result = feedback.map((el) => {
        return el.feedbackResults.map((item) => item.answerId);
          });
          let mergedResults = [].concat.apply([], result);
          const getAns= getAnswerArray.map((item) => item.answers);
          let getAnsMerged = [].concat.apply([], getAns);
          const matchedResults= mergedResults.map((item) => getAnsMerged.filter((el) => el.id == item));
          let removeArraySymbol = [].concat.apply([], matchedResults);
          const total = removeArraySymbol.reduce((a, b) => ({ weightage: a.weightage + b.weightage }));
          // count total and devide to total
          const avgMeetingScore = Math.trunc(total.weightage / removeArraySymbol.length);
          // res.json(mergedResults);
     res.json({ subject, members, dateEnd, totalFeedback, noResponse, avgMeetingScore, goodMeeting: gooMeeting.length, badMeeting: badMeeting.length });
    } catch (err) {
      err.status = err.name === 'CastError' ? 404 : 500;
      next(err);
    }
  };

  search = async (_req, res, next) => {
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

  fetch = async (req, res, _next) => {
    // const userId = req.query.userId;
    const userId = '5dfb604ef71b907b18a8dda9';
    const userMeetings = await Meeting.find({ _user: userId }).populate(
      '_user'
    );
    // const members = userMeetings.map((item) => item.invites.split(',').length);

    res.json(userMeetings);
  };

  getMembers = async (req, res, _next) => {
    const meetingId = '5dffad06a9d36afc546e5f6d';
    const members = await Meeting.find({ _id: meetingId });
    const memberCount = members.map((item) => item.invites.split(','));
    const feedback = await Feedback.find({ meetingId: meetingId });
    const membersFeedback = {
      members: memberCount.length, feebackCount: feedback.length,
    };
    res.json(membersFeedback);
  }

  getFeedbacks = async () => {

  }

  /**
   * req.user is populated by middleware in routes.js
   */

  create = async (req, res, next) => {
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

  delete = async (req, res, next) => {
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
