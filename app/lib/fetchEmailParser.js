import Imap from 'imap';
Imap.inspect = require('util').inspect;
let MailParser = require('mailparser').MailParser;
const simpleParser = require('mailparser').simpleParser;
let Promise = require('bluebird');
const dateFormat = require('dateformat');
Promise.longStackTraces();
import ical from 'cal-parser';
import { findUserIdByEmail } from './util.js';
import User from '../models/user';
import Meetings from '../models/meetings';
import Invites from '../models/invites.js';

let imapConfig = {
  user: 'havea@goodmeeting.today',
  password: 'S4v3T1m3',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};

export const events = async (req, res) => {
  let imap = new Imap(imapConfig);
  Promise.promisifyAll(imap);

  imap.once('ready', execute);
  imap.once('error', function(err) {
    console.log('Connection error: ' + err.stack);
  });

  imap.connect();
  let eventsDta = [];
  function execute() {
    let flag = 0;
    imap.openBox('INBOX', false, function(err, mailBox) {
      if (err) {
        console.error(err);
        return;
      }
      imap.search(['UNSEEN'], function(
        err,
        results
      ) {
        if (!results || !results.length) {
         // res.status(200).json({ status: true, events: 'No unread mails' });
          console.log('No unread mails');
          imap.end();
          return;
        }
        imap.setFlags(results, ['\\Seen'], function(err) {
          if (!err) {
            console.log('marked as read');
          } else {
            console.log(JSON.stringify(err, null, 2));
          }
        });

        let f = imap.fetch(results, { bodies: '' });
        f.on('message', processMessage);
        f.once('error', function(err) {
          return Promise.reject(err);
        });
        f.once('end', async function() {
          console.log('Done fetching all event messages.');
          imap.end();
          for (let x = 0; x < eventsDta.length; x++) {
            if (eventsDta[x].buffer) {
              let buffer = eventsDta[x].buffer;
              await simpleParser(buffer)
                .then(function(mail_object) {
                  if(!mail_object.attachments[0]) throw new Error('its not event');
                  let fileData = mail_object.attachments[0].content
                    .toString('utf8')
                    .replace(/\s/g, '');
                  let allAttendees = fileData.match(
                    new RegExp('mailto:' + '(.*?)' + 'ATTENDEE', 'gm')
                  );
                  allAttendees.push(
                    fileData.substring(
                      fileData.lastIndexOf('mailto:'),
                      fileData.lastIndexOf('DESCRIPTION;')
                    )
                  );
                  allAttendees = allAttendees
                    .join()
                    .replace(/MAILTO:/g, '')
                    .replace(/ATTENDEE/g, '')
                    .split(',');
                  let Organizer = allAttendees[0];
                  allAttendees.shift();
                  let Location = fileData
                    .substring(
                      fileData.lastIndexOf('LOCATIONDISPLAYNAME:'),
                      fileData.lastIndexOf('X-MICROSOFT-LOCATIONSOURCE:')
                    )
                    .replace(/\\/g, '')
                    .replace('X-MICROSOFT-LOCATIONSOURCE:', '')
                    .replace('LOCATIONDISPLAYNAME', '');
                  let DateStart = fileData.substring(
                    fileData.lastIndexOf('DTSTART;'),
                    fileData.lastIndexOf('DTEND;')
                  );
                  DateStart = DateStart.substring(
                    DateStart.lastIndexOf(':') + 1,
                    DateStart.length
                  );
                  let DateEnd = fileData.substring(
                    fileData.lastIndexOf('DTEND;'),
                    fileData.lastIndexOf('CLASS:')
                  );
                  DateEnd = DateEnd.substring(
                    DateEnd.lastIndexOf(':') + 1,
                    DateEnd.length
                  );
                  eventsDta[x] = {
                    Subject: eventsDta[x].Subject,
                    Organizer: Organizer,
                    Invites: allAttendees
                      .join()
                      .replace('havea@goodmeeting.today,', '')
                      .replace('havea@goodmeeting.today', '')
                      .trim(),
                    DateStart: DateStart,
                    DateEnd: DateEnd,
                    Location: Location,
                  };
                })
                .catch(function(err) {
                  flag = 1;
                  console.log('An error occurred:', err.message);
                });
            }
            if (x == eventsDta.length - 1 && flag !== 1) {
               const emailFetchedData = eventsDta.map(async (item) => {
              const userId = await findUserId(item.Organizer);
                if (userId) {
                    const mapData = {
                        subject: item.Subject,
                        organizer: item.Organizer,
                        invites: item.Invites,
                        dateStart: item.DateStart instanceof Date && !isNaN(item.DateStart) ?
                        dateFormat(item.DateStart, 'dddd, mmmm dS, yyyy, h:MM:ss TT') : '',
                        dateEnd: item.DateEnd instanceof Date && !isNaN(item.DateEnd) ?
                        dateFormat(item.DateEnd, 'dddd, mmmm dS, yyyy, h:MM:ss TT'): '',
                        location: item.Location,
                        _user: userId,
                    };
                   const updateMeetings = new Meetings({
                        ...mapData,
                    });
                    updateDataInModels(updateMeetings);
                }
                });

              // res.status(200).json({ status: true, events: eventsDta });
            }
          }
        });
      });
    });
  }
  const findUserId = (item) =>{
    const id = findUserIdByEmail(item);
    return id;
  };
  const updateDataInModels = async (data) =>{
    const meetingsAdded = await data.save();
    const invitesArray = meetingsAdded.invites.split(',');
  //  const invitesArray = 'ahafiz167@gmail.com, saeed@thirtynorth.dev';
    // if(!invitesArray.length) return null;
    const updatedArray = invitesArray.map((item)=> item);
       updatedArray.map((item) => {
        const mapInvitesData = {
          invitesEmail: item,
          meetingId: meetingsAdded._id,
      };
      const updateInvites = new Invites({
          ...mapInvitesData,
      });
      updateInvites.save();
       });
  };

  function processMessage(msg, seqno) {
    let parser = new MailParser();
    let subject = '';
    parser.on('headers', (headers) => {
      subject = headers.get('subject');
    });
    parser.on('data', (data) => {
      // if (data.type === "text") {
      //   console.log(seqno);
      //   console.log(data.text); /* data.html*/
      // }
      if (data.type === 'attachment') {
        data.content.pipe(process.stdout);
        data.content.on('end', () => data.release());
      }
    });

    msg.on('body', function(stream, info) {
      let buffer = '';
      stream.on('data', function(chunk) {
        buffer += chunk.toString('utf8');
      });
      stream.once('end', async function() {
        if (info.which !== 'TEXT') {
          let headerObject = Imap.parseHeader(buffer);
          headerObject.subject[0] = headerObject.subject[0].replace(
            '(havea@goodmeeting.today)',
            ''
          );
          if (buffer.indexOf('invite.ics') > -1) {
            const parsed = ical.parseString(buffer);
            eventsDta.push({
              Subject: headerObject.subject,
              Organizer: parsed.events[0].organizer.params.cn,
              Invites: parsed.calendarData.to
                .replace('havea@goodmeeting.today,', '')
                .replace('havea@goodmeeting.today', '')
                .trim(),
              DateStart: parsed.events[0].dtstart.value,
              DateEnd: parsed.events[0].dtend.value,
              Location: parsed.events[0].location.value,
            });
          } else {
            eventsDta.push({
              Subject: headerObject.subject,
              buffer: buffer,
            });
          }
        } else console.log(prefix + 'Body [%s] Finished', inspect(info.which));
      });
      let data = '';
      // stream.on("data", function(chunk) {
      //   parser.write(chunk.toString("utf8"));
      // });
    });
    msg.once('end', function() {
      // console.log("Finished msg #" + seqno);
      parser.end();
    });
  }
};
