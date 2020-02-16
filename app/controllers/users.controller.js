import BaseController from './base.controller';
import User from '../models/user';
import multer from 'multer';
import ContactUsModel from '../models/contactUs';
const path = require('path');
import { sendRegistrationEmail, forgotPasswordEmail, contactUsEmail } from '../lib/util';
import { uploadImages } from '../lib/util';
class UsersController extends BaseController {
  whitelist = [
    'firstname',
    'lastname',
    'email',
    'password',
    'fullName',
    'message',
    'name',
    'avatar',
  ];

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
    } catch(err) {
      next(err);
    }
  }

  search = async(_req, res, next) => {
    try {
      // @TODO Add pagination
      res.json(await User.find());
    } catch(err) {
      next(err);
    }
  }

  fetch = (req, res) => {
    const user = req.user || req.currentUser;

    if (!user) {
      return res.sendStatus(404);
    }

    res.json(user);
  }

  create = async(req, res, next) => {
    const params = this.filterParams(req.body, this.whitelist);
    let newUser = new User({
      ...params,
      provider: 'local',
    });
    try {
      const savedUser = await newUser.save();
      const token = savedUser.generateToken();
      await sendRegistrationEmail(params.email);
      res.status(201).json({ token, message: 'Your account is created successfully!' });
    } catch(err) {
      err.status = 400;
      next(err);
    }
  }

  contactUs = async(req, res, next) => {
    const filteredParams = this.filterParams(req.body, this.whitelist);
    await contactUsEmail(filteredParams);
    let Inquery = new ContactUsModel({
      ...filteredParams,
    });
    await Inquery.save();
    res.status(201).json({ messageResponse: 'your query has been submitted, Admin will come back shortly!' });
  }

  updateProfile = async(req, res, next) => {
    const newAttributes = this.filterParams(req.body, this.whitelist);
    const updatedUser = Object.assign({}, req.currentUser, newAttributes);
   const uploadFunction = await uploadImages();
   uploadFunction(req, res, function(err) {
      if(err) return;
      res.json({ updatedUser, success: true });
            });
  };
  update = async(req, res, next) => {
    const newAttributes = this.filterParams(req.body, this.whitelist);
    const updatedUser = Object.assign({}, req.currentUser, newAttributes);
    const query = req.query.userId !== 'undefined' ? req.query.userId : '';
    const user = await User.findById({ _id: query });
    user.password = updatedUser.password;
    try {
      if(!user) {
        return res.status(500).json({ message: 'user does not exist!' });
      }
      await user.save();
      res.status(200).json({ message: 'password has been updated' });
    } catch (err) {
      next(err);
    }
  }

  delete = async(req, res, next) => {
    if (!req.currentUser) {
      return res.sendStatus(403);
    }

    try {
      await req.currentUser.remove();
      res.sendStatus(204);
    } catch(err) {
      next(err);
    }
  }
  forgotPassword = async(req, res, next) => {
      try{
        const { body: { email } } = req;
          const user = await User.findOne({ email });
          if (!user) {
            next();
            res.status(404).json({ message: 'user is not exist!' });
          }

        await forgotPasswordEmail(user);
        res.status(200).json({ message: 'please check your email, password reset link has been mailed' });
      }catch(err) {
        err.status = 400;
        next(err);
      }
   }
}


export default new UsersController();
