import nodemailer from 'nodemailer';
import { reigstrationEmailTemplate, feedbackEmailTemplate, forgotPasswordTemplate } from './emails';
import User from '../models/user.js';
import Invites from '../models/invites';
import Meeting from '../models/meetings';
import dateFormat from 'dateformat';

export const sendRegistrationEmail = async(sendTo) =>{
  let transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
       user: 'havea@goodmeeting.today',
       pass: 'S4v3T1m3',
    },
});
  const message = {
    from: 'havea@goodmeeting.today', // Sender address
    to: sendTo, // List of recipients
    subject: 'Welcome In Good Meeting', // Subject line
    html: reigstrationEmailTemplate,
};
transport.sendMail(message, function(err, info) {
    if (err) {
      return err.json({ message: '' });
    } else {
      return info.json({ message: 'Registration email has been sent please verify!' });
    }
});
  };

  export const forgotPasswordEmail = async(user) => {
      const updateUrl = 'http://18.219.243.112/update-password';
      const userId = user._id;
      let transport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
           user: 'havea@goodmeeting.today',
           pass: 'S4v3T1m3',
        },
    });
    const message = {
      from: 'havea@goodmeeting.today', // Sender address
      to: user.email, // List of recipients
      subject: 'Password Reset Request', // Subject line
      html: forgotPasswordTemplate(updateUrl, userId),
  };
  transport.sendMail(message, function(err, info) {
      if (err) {
        return err.json({ message: '' });
      } else {
        return info.json({ message: 'Reset Link has been mailed' });
      }
  });
  };

export const findUserIdByEmail = async(email) => {
  const user = await User.findOne({ email });
  if(!user) {
    return false;
  }
  return user._id;
}
;
const sendFeedbackMail = async(sendTo, inviteId, updatedCurrentDate, subject, fullName) =>{
  let transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
       user: 'havea@goodmeeting.today',
       pass: 'S4v3T1m3',
    },
});
const InviteeObject = await Invites.findOne({ _id: inviteId });
const meetingId = InviteeObject.meetingId;
const message = {
  from: 'havea@goodmeeting.today', // Sender address
  to: sendTo, // List of recipients
  subject: 'Good Meeting Feedbacks', // Subject line
  html: feedbackEmailTemplate(meetingId, sendTo, inviteId, fullName, updatedCurrentDate, subject),
};

transport.sendMail(message, function(err, info) {
  if (err) {
   console.log('Error', err);
  } else {
 console.log('Feedback Mail Sent');
  }
});
};
export const sendFeedbackEmailsToInvites = async() =>{
  const invites = await Invites.find({});
  let CurrentDate = new Date();
   let updatedCurrentDate = dateFormat(CurrentDate, 'dddd, mmmm dS, yyyy, h:MM:ss TT');
  invites.map((item) => {
    if(!item.isEmailSent) {
        Meeting.findOne({ _id: item.meetingId }).populate('_user').exec((err, meeting) => {
          if(updatedCurrentDate >= meeting.dateEnd) {
            let subject = meeting.subject[0] || 'Good Meetings';
            sendFeedbackMail(item.invitesEmail, item._id, updatedCurrentDate, subject, meeting._user.fullName);
            item.isEmailSent = true;
            item.save();
          } else {
            console.log('Meeting time not end till yet');
          }
        });
    }
  });
  console.log('Meeting time not end till yet');
};
