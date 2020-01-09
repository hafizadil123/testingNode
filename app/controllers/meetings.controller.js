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
     // console.log(feedback);
      const gooMeeting = feedback.filter((item) => item.isGood ===true);
      const badMeeting = feedback.filter((item) => item.isGood === false);
      const totalFeedback = feedback.length;
      const noResponse = members - totalFeedback;
      result = feedback.map((el) => {
        return el.feedbackResults.map((item) => item.answerId);
      });
      let mergedResults = [].concat.apply([], result);
      const getAns = getAnswerArray.map((item) => item.answers);
      let getAnsMerged = [].concat.apply([], getAns);
      const matchedResults = mergedResults.map((item) =>
        getAnsMerged.filter((el) => el.id == item)
      );
      let removeArraySymbol = [].concat.apply([], matchedResults || []);
      const total =removeArraySymbol.length > 0 && removeArraySymbol.reduce((a, b) => ({
        weightage: a.weightage + b.weightage,
      }, 0)) || 0;
      // count total and devide to total
      const avgMeetingScore = Math.trunc(
        total.weightage / removeArraySymbol.length
      );
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
    const userId = req.query.userId;
    const userMeetings = await Meeting.find({ _user: userId }).populate(
      '_user'
    );
    // const members = userMeetings.map((item) => item.invites.split(',').length);

    //  userMeetings me sari ek user ki meetings mil rahi hain... meny us meeting kitny members r kitny bndo ny feedback
    const getMembersArray = userMeetings.map(
      async (item) => await this.getMembers(item._id)
    );
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

  getMembers = async (id) => {
    const meetingId = id;
    // const meetingId = '5dffad06a9d36afc546e5f6d';
    const members = await Meeting.findOne({ _id: meetingId });
    const memberCount = members.invites.split(',');
    const feedback = await Feedback.find({ meetingId: meetingId });
    const membersFeedback = {
      members: memberCount.length,
      feebackCount: feedback.length,
    };
    return membersFeedback;
  };

  getFeedbacks = async () => {};

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
