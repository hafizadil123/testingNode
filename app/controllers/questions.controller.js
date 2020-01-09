import BaseController from './base.controller';
import Questions from '../models/questionAnswers';
import Feedback from '../models/feedback';
const mongoose = require('mongoose');
import _ from 'lodash';
class QuestionsController extends BaseController {
  whitelist = ['text'];

  // Middleware to populate post based on url param
  _populate = async (req, res, next) => {
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
              if ((feedbackResult.answerId) in obj) {
                obj[feedbackResult.answerId] = obj[feedbackResult.answerId]+ 1;
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
      if(answer.id in obj) {
        answer['count'] = obj[answer.id];
      }
    })

  );

  questionAnswers.forEach((item) =>{
    const sortedArray = _.sortBy(item.answers, 'weightage').reverse();
    item.answers = sortedArray;
  }
  );

    res.json(questionAnswers);
    } catch (err) {
      err.status = err.name === 'CastError' ? 404 : 500;
      next(err);
    }
  };

  search = async (req, res, next) => {
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

  fetch = async (req, res) => {
    const questionAnswers = await Questions.find({});
    const feedback = await Feedback.find({});
    const obj = {};
    feedback.forEach((feedbackItem) =>
      feedbackItem.feedbackResults.forEach((feedbackResult) =>
        questionAnswers.forEach((questionItem) =>
          questionItem.answers.forEach((ansItem) => {
            if (feedbackResult.answerId == ansItem.id) {
              if ((feedbackResult.answerId) in obj) {
                obj[feedbackResult.answerId] = obj[feedbackResult.answerId]+ 1;
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
      if(answer.id in obj) {
        answer['count'] = obj[answer.id];
      }
    })

  );

  questionAnswers.forEach((item) =>{
    const sortedArray = _.sortBy(item.answers, 'weightage').reverse();
    item.answers = sortedArray;
  }
  );

    res.json(questionAnswers);
  };
  /**
   * req.user is populated by middleware in routes.js
   */

  create = async (req, res, next) => {
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

export default new QuestionsController();
