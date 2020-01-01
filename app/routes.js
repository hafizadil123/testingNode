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
routes.get('/users/:username', UsersController._populate, UsersController.fetch);
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


// Admin
routes.get('/admin', accessControl('admin'), MetaController.index);

routes.use(errorHandler);

export default routes;
