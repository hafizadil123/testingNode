import { Router } from 'express';

import MetaController from './controllers/meta.controller';
import AuthController from './controllers/auth.controller';
import UsersController from './controllers/users.controller';
import PostsController from './controllers/posts.controller';
import MeetingsController from './controllers/meetings.controller';
import FeedbackController from './controllers/feedback.controller';
import QuestionController from './controllers/questions.controller';
import authenticate from './middleware/authenticate';
import accessControl from './middleware/access-control';
import errorHandler from './middleware/error-handler';
import User from '../app/models/user.js';
let multer = require('multer');
import bcrypt from 'bcrypt';
const path = require('path');
let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, './public/images'));
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg');
  },
});
const upload = multer({ storage: storage });
const routes = new Router();

routes.get('/', MetaController.index);

// Authentication
routes.post('/auth/login', AuthController.login);

// Users
routes.get('/users', UsersController.search);
routes.post('/users', UsersController.create);
routes.get('/users/me', authenticate, UsersController.fetch);
routes.put('/users/me', authenticate, UsersController.update);
routes.delete('/users/me', authenticate, UsersController.delete);
routes.get(
  '/users/:username',
  UsersController._populate,
  UsersController.fetch
);
routes.post('/users/forgot-password', UsersController.forgotPassword);
routes.post('/users/update-password', UsersController.update);
// Post
routes.get('/posts', PostsController.search);
routes.post('/posts', authenticate, PostsController.create);
routes.get('/posts/:id', PostsController._populate, PostsController.fetch);
routes.delete('/posts/:id', authenticate, PostsController.delete);

// Meetings
routes.post('/create-meeting', MeetingsController.create);
routes.get('/get-meetings', MeetingsController.fetch);
routes.get('/get-meeting-by-id', MeetingsController._populate);
routes.get('/get-members-feedback-count', MeetingsController.getMembers);

// Feedbacks
routes.post('/create-feedback', FeedbackController.create);
routes.get('/get-feedbacks', FeedbackController.fetch);
routes.get('/get-feedback/:id', FeedbackController._populate);
routes.get('/get-feedback-stats/', FeedbackController.feedbackStats);

// Questions
routes.post('/create-questions', QuestionController.create);
routes.get('/get-questions', QuestionController.fetch);
routes.get('/get-feedback/:id', QuestionController._populate);
routes.get('/get-summary', QuestionController.getSummary);
routes.get('/get-stats-by-user-id', QuestionController.getStatsQuestion);
// get-question-by-id
routes.get('/get-question-by-id', QuestionController._populate);
// Admin
routes.get('/admin', accessControl('admin'), MetaController.index);

routes.post('/contact-us', UsersController.contactUs);
routes.get('/get-profile', UsersController.getProfile);
routes.post('/update-profile', upload.single('avatar'), async function(
  req,
  res,
  next
) {
  const { name, email, oldPassword, newPassword, avatar } = req.body;
  let insObject = { fullName: name, email };
  if (avatar) insObject['avatar'] = avatar;

    const isModifiedPassword = async() => {
      const user = await User.findById(req.query.userId);
      if (user) {
        if (newPassword && oldPassword) {
          if (user.authenticate(oldPassword)) {
           bcrypt.hash(newPassword, 4).then((hash) => {
             insObject['password'] = hash;
             const objectFile = { fullName: insObject.fullName, password: insObject.password };
             if(req.file) {
               objectFile['avatar'] = req.file.filename;
             }
             User.update({ _id: req.query.userId }, { $set: objectFile  }, { multi: true, new: true } ).then((user) => {
              if(user) {
                return res.json({ message: 'Profile updated successfully.',
                success: true,
                user: objectFile });
              }
            });
           });
          } else {
              return false;
          }
        }
        if(name && !newPassword && !oldPassword) {
          const objectFile = { fullName: insObject.fullName };
          if(req.file) {
            objectFile['avatar'] = req.file.filename;
          }
          User.update({ _id: req.query.userId }, { $set: objectFile }, { multi: true, new: true } ).then((user) => {
            if(user) {
              return res.json({ message: 'Profile updated successfully.',
              success: true,
              user: objectFile });
            }
          });
        }
    }
    return true;
  };
  const result = await isModifiedPassword();
  if(result) {
    //return res.json({ message: 'user not found!', success: false });
  } else {
    return res.json({ message: 'old password is incorrect.', success: false });
  }
  }
);

routes.use(errorHandler);

export default routes;
