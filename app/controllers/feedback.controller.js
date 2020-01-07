/* eslint-disable prefer-spread */
/* eslint-disable no-undef */
import BaseController from './base.controller';
import Feedback from '../models/feedback';
import Invites from '../models/invites';
import Meeting from '../models/meetings';
import QuestionAnswers from '../models/questionAnswers';
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
  _populate = async (req, _res, next) => {
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
    } catch (err) {
      err.status = err.name === 'CastError' ? 404 : 500;
      next(err);
    }
  };

  search = async (_req, res, next) => {
    try {
      const posts = await Feedback.find({}).populate({
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

  fetch = (req, res) => {
    res.json(req.post);
  };

  /**
   * req.user is populated by middleware in routes.js
   */

  create = async (req, res, next) => {
    const params = this.filterParams(req.body, this.whitelist);
    const isAlreadyExist = await Feedback.findOne({
      inviteeId: req.body.inviteeId,
    });
    if (isAlreadyExist) {
      return res
        .status(400)
        .json({ message: 'you already submitted feedback of this meeting' });
    }
    const feedback = new Feedback({
      ...params,
    });

    try {
      await feedback.save();
      const inviteObject = await Invites.findById(req.body.inviteeId);
      inviteObject.isFeedbackGiven = true;
      await inviteObject.save();
      res
        .status(201)
        .json({
          message: 'Thank you, your feedback is submitted succesfully!',
        });
    } catch (err) {
      next(err);
    }
  };
  getResult = async (
    res,
    positiveReviews,
    negativeReviews,
    meeting,
    userId
  ) => {
    let pos = 0;
    let neg = 0;
    let avgValue = 0;
    let tot = 0;
    const getAnswerArray = await QuestionAnswers.find({});
    getAnswerArray.map((item) => item.answer);
     await Meeting.find({ _user: userId })
      .populate('_user')
      .exec(function(err, userMeetings) {
        let result = '';
        if (err) {
          return res.status(500).json(err);
        } else {
         userMeetings.map((item) => {
           return Feedback.find({ meetingId: item._id }).exec(function(
              err,
              userMeetingFeedback
            ) {
              if (err) {
                return res.status(500).json(err);
              } else {
                result =
                  userMeetingFeedback &&
                  userMeetingFeedback.length > 0 &&
                  userMeetingFeedback.map((el) => {
                    return el.feedbackResults.map((item) => item.answerId);
                  });
                // make array flattened
                let mergedResults = [].concat.apply([], result || []);
                const getAns =
                  getAnswerArray &&
                  getAnswerArray.length > 0 &&
                  getAnswerArray.map((item) => item.answers);
                let getAnsMerged = [].concat.apply([], getAns || []);
                const matchedResults = mergedResults.map((item) =>
                  getAnsMerged.filter((el) => el.id == item)
                );
                let removeArraySymbol = [].concat.apply(
                  [],
                  matchedResults || []
                );
                let total = 0;
                total =
                  removeArraySymbol &&
                  removeArraySymbol.length > 0 &&
                  removeArraySymbol.reduce(
                    (a, b) => ({ weightage: a.weightage + b.weightage }, 0)
                  );
                // count total and devide to total
                const avg = Math.trunc(
                  total.weightage / removeArraySymbol.length
                );
                // return json response
                res.json({ positiveReviews,
                 negativeReviews,
                avg: avg || 0,
               meeting,
               });
              }
            });
          });
        }
      });
  };
  feedbackStats = async (req, res, next) => {
    const positiveReviews = await Feedback.find({ isGood: true });
    const negativeReviews = await Feedback.find({ isGood: false });
    const meeting = await Meeting.find({
      createdAt: {
        $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000),
      },
    });
    const userId = req.query.userId;
    // get user meetings with Id

    this.getResult(
      res,
      positiveReviews.length,
      negativeReviews.length,
      meeting.length,
      userId
    );
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

export default new FeedbackController();
