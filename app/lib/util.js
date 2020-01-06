import nodemailer from 'nodemailer';
import { reigstrationEmailTemplate, feedbackEmailTemplate, forgotPasswordTemplate} from './emails';
import User from '../models/user.js';
import Invites from '../models/invites';
import Meeting from '../models/meetings';

export const sendRegistrationEmail = async () =>{
    let transport = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
         user: 'feb99997dd70db',
         pass: 'edf064cfd22651',
      },
  });
  const message = {
    from: 'saeed@thirtyNorth.dev', // Sender address
    to: 'adil@gmail.com',         // List of recipients
    subject: 'Good Meeting Subject', // Subject line
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

  export const forgotPasswordEmail = async (user) => {
      const updateUrl = 'http://18.224.18.173//update-password';
      const userId = user._id;
    let transport = nodemailer.createTransport({
        host: 'smtp.mailtrap.io',
        port: 2525,
        auth: {
           user: 'feb99997dd70db',
           pass: 'edf064cfd22651',
        },
    });
    const message = {
      from: 'saeed@thirtyNorth.dev', // Sender address
      to: 'adil@gmail.com',         // List of recipients
      subject: 'Good Meeting Subject', // Subject line
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
  } return user._id;
}
;
const sendFeedbackMail = async (sendTo, inviteId) =>{
  let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
       user: 'feb99997dd70db',
       pass: 'edf064cfd22651',
    },
});
const InviteeObject = await Invites.findOne({ _id: inviteId });
const meetingId = InviteeObject.meetingId;

const message = {
  from: 'saeed@thirtyNorth.dev', // Sender address
  to: sendTo,         // List of recipients
  subject: 'Good Meeting Subject', // Subject line
  html: feedbackEmailTemplate(meetingId, sendTo, inviteId),
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
  invites.map((item) => {
    if(!item.isEmailSent) {
      sendFeedbackMail(item.invitesEmail, item._id);
      item.isEmailSent = true;
      item.save();
    }
  });
};
