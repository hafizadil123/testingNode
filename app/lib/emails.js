/* eslint-disable linebreak-style */
/* eslint-disable max-len */
export const feedbackOrganizerEmailTemplate = (sub, meetingDate, endFeedbackdate) => `
<p>Hello,</p>
<p>You’ve received your first feedback for your meeting titled <strong>"${sub}"</strong> on <strong>"${meetingDate}"</strong> date.</p>
<p>Your participants still have a few more days to complete the survey.  Log back in to check your performance on <strong>"${endFeedbackdate}"</strong> date.</p>
<p>Thank you for being part of the solution!</p>
<p>Kind regards,</p>
<p>Good meeting team</p>
`;
export const organizerFeedbackSchedulerEmailTemplate = (sub) => `Your meeting <strong>"${sub}"</strong> 7 days time for receiving feedback is over, please login to check the feedback.`;
export const reigstrationEmailTemplate = `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">

<style type="text/css">

  #outlook a {
      padding: 0;
  }

  .ReadMsgBody {
      width: 100%;
  }

  .ExternalClass {
      width: 100%;
  }

  .ExternalClass * {
      line-height: 100%;
  }

  body {
      font-family: Open Sans;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
  }

  table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
  }

  img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
  }

  p {
      display: block;
      margin: 13px 0;
  }
</style>
<style type="text/css">
  @media only screen and (max-width: 480px) {
      @-ms-viewport {
          width: 320px;
      }
      @viewport {
          width: 320px;
      }
  }
</style>
<style type="text/css">
  @media only screen and (min-width: 480px) {
      .mj-column-per-100 {
          width: 100% !important;
      }
  }
</style>

</head>
<body style="font-family: 'Open Sans', sans-serif;background: #FFFFFF;">

<div class="mj-container" style="background-color:#FFFFFF;">
<div style="margin:0px auto;max-width:800px;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center"
         border="0">
      <tbody>
      <tr>
          <td style="text-align:center;vertical-align:top;direction:ltr;">
              <div class="mj-column-per-100 outlook-group-fix"
                   style="vertical-align:top;display:inline-block;direction:ltr;text-align:left;width:100%;">
                  <table role="presentation" width="800" cellpadding="0" cellspacing="0"
                         style="width:800px;max-width:800px;min-width:800px" align="center" border="0">
                      <tbody>
                      <tr>
                          <td style="word-wrap:break-word;" align="center">
                              <div style="cursor:auto;text-align:center;position: relative;">
                                  <table align="center" border="0" cellpadding="0" cellspacing="0">
                                      <tbody>

                                      <tr>
                                          <td>
                                              <h1 style="color:#E15752;font-size:32px;text-align:center;line-height:	25px;font-weight:bold">
                                                  GoodMeeting Today</h1>
                                              <h2 style="color:#5e5e5e;font-size:28px;text-align:center;line-height:  25px;font-weight:normal; margin-top: 40px;">
                                                  Welcome to Good Meeting Today. </h2>
                                              <p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">
                                                  

                                              Congratulations on taking the first step to having more efficient meetings! </p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">We exist to tackles the obstacle of inefficient, unproductive and unnecessary meetings. We do this through a two-step process that provides feedback on the conferences you hold as well as allowing you to critically evaluate those you are a participant in.  The ability to assess meeting productivity in turn ensures corporate productivity. </p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">Are you ready to get started? Just create a meeting as you normally would and add <b>havea@goodmeeting.today</b> as an attendee.  That’s it – we’ll do the rest from there.</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">Your participants will get a follow up email after the meeting asking them 4 quick questions. All feedback that is given is anonymous, and they have 1 week to answer the short questionnaire.</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">Once we collect feedback, log back in to view your meeting statistics and performance.</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">Thank you for actively tackling the issue of inefficient, and unproductive meetings.</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">Should you have any questions or concerns please do not hesitate to contact us on:</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">All the best,</p>

<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">The Good Meeting team</p>

                                          </td>
                                      </tr>


                                      </td>
                                      </tr>
                                      </tbody>
                                  </table>
                              </div>
                          </td>
                      </tr>
                      </tbody>
                  </table>
              </div>
          </td>
      </tr>
      </tbody>
  </table>
</div>
</div>

</div>
</body>
</html>`;
export const forgotPasswordTemplate = (updateUrl, userId) => `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">

    <style type="text/css">

        #outlook a { padding: 0; }
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass * { line-height:100%; }
        body { font-family: Open Sans; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { border-collapse:collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        p { display: block; margin: 13px 0; }
    </style>
    <style type="text/css">
        @media only screen and (max-width:480px)
        {
            @-ms-viewport { width:320px; }
            @viewport { width:320px; }
        }
    </style>
    <style type="text/css">
        @media only screen and (min-width:480px) {
            .mj-column-per-100 { width:100%!important; }  }
    </style>

</head>
<body style="font-family: 'Open Sans', sans-serif;background: #FFFFFF;">

<div class="mj-container" style="background-color:#FFFFFF;">
    <div style="margin:40px auto;max-width:800px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0">
            <tbody>
            <tr>
                <td style="text-align:center;vertical-align:top;direction:ltr;">
                    <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;text-align:left;width:100%;">
                        <table role="presentation" width="800" cellpadding="0" cellspacing="0" style="width:800px;max-width:800px;min-width:800px" align="center" border="0" >
                            <tbody>
                            <tr>
                                <td style="word-wrap:break-word;" align="center">
                                    <div style="cursor:auto;text-align:center;position: relative;">
                                        <table align="center" border="0" cellpadding="0" cellspacing="0">
                                            <tbody>
                                            
                                            <tr>
                                                <td>
                                                    <img style="display:block;margin:0 auto;" src="https://goodmeeting.today/img/logo.png" width='200' alt="">
                                                    
                                                    <h2 style="color:#5e5e5e;font-size:18px;text-align:center;font-weight:bolder; margin-top: 70px;">You told us you forgot password. If you really did, Click here to choose a new one. </h2>
                                                    <ul style="margin: 50px 0px;text-align: center;">
                                                        <li style="display: inline-block;">
                                                            <a style="color: #fff;font-size:16px;background-color: #0653D7;text-decoration: none;    padding: 15px 40px;    border-radius: 0;margin-right: 0;"   href="${updateUrl}?userId=${userId}">Choose a new password</a>
                                                        </li> 
                                                    </ul>        
                                                    <p style="color:#625675;font-size:16px;text-align:center;line-height:   25px;font-weight:bolder">If you didn't mean to reset password, then you can just ignore this<br> email, your password will not change.</p>
                                                </td>
                                            </tr>
                                           


                                            </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</div>

</div>
</body>
</html>`;
export const feedbackEmailTemplate = (
  meetingId,
  inviteEmail,
  inviteName,
  userName,
  startDateTime,
  subject
) => `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">

    <style type="text/css">

        #outlook a {
            padding: 0;
        }

        .ReadMsgBody {
            width: 100%;
        }

        .ExternalClass {
            width: 100%;
        }

        .ExternalClass * {
            line-height: 100%;
        }

        body {
            font-family: Open Sans;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table, td {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }

        p {
            display: block;
            margin: 13px 0;
        }
    </style>
    <style type="text/css">
        @media only screen and (max-width: 480px) {
            @-ms-viewport {
                width: 320px;
            }
            @viewport {
                width: 320px;
            }
        }
    </style>
    <style type="text/css">
        @media only screen and (min-width: 480px) {
            .mj-column-per-100 {
                width: 100% !important;
            }
        }
    </style>

</head>
<body style="font-family: 'Open Sans', sans-serif;background: #FFFFFF;">

<div class="mj-container" style="background-color:#FFFFFF;">
    <div style="margin:0px auto;max-width:800px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center"
               border="0">
            <tbody>
            <tr>
                <td style="text-align:center;vertical-align:top;direction:ltr;">
                    <div class="mj-column-per-100 outlook-group-fix"
                         style="vertical-align:top;display:inline-block;direction:ltr;text-align:left;width:100%;">
                        <table role="presentation" width="800" cellpadding="0" cellspacing="0"
                               style="width:800px;max-width:800px;min-width:800px" align="center" border="0">
                            <tbody>
                            <tr>
                                <td style="word-wrap:break-word;" align="center">
                                    <div style="cursor:auto;text-align:center;position: relative;">
                                        <table align="center" border="0" cellpadding="0" cellspacing="0">
                                            <tbody>

                                            <tr>
                                                <td>
                                                    <h1 style="color:#E15752;font-size:32px;text-align:center;line-height:	25px;font-weight:bold">
                                                        GoodMeeting Today</h1>
														
									
														<p style="color:#625675;font-size:14px;text-align:center;line-height:	25px;font-weight:normal"> Thank you for attending the meeting with ${userName} on ${startDateTime} with the subject ${subject}. </p>
														
														
                                                    <h2 style="color:#5e5e5e;font-size:28px;text-align:center;line-height:  25px;font-weight:normal; margin-top: 40px;">
                                                        Help them out by just answering this, was this a good meeting: </h2>
                                                    <ul style="margin: 50px 0px;text-align: center;">
                                                        <li style="display: inline-block;">
                                                            <a style="color: #fff;font-size:16px;background-color: #625675;text-decoration: none;    padding: 10px 15px;    border-radius: 50px;margin-right: 15px;"
                                                               href='https://goodmeeting.today/feedback-form?isGood=1&meetingId=${meetingId}&name=${userName}&invitee=${inviteName}'>Yes, on the whole it was good</a>
                                                        </li>
                                                        <li style="display: inline-block;">
                                                            <a style="color: #fff;font-size:16px;background-color: #E15752;text-decoration: none;    padding: 10px 15px;    border-radius: 50px;"
                                                               href="https://goodmeeting.today/feedback-form?isGood=0&meetingId=${meetingId}&name=${userName}&invitee=${inviteName}">No, overall it wasn’t great</a>
                                                        </li>
                                                    </ul>
                                                    <p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">
                                                        Did you know that according to Bartleby’s Law: “80% of the time of 80% of the people in meetings is wasted.”? </p>

														<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal">That equals a lot of people and even more money. </p>

														<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal"> Thankfully, ${userName} uses Good Meeting Today to get feedback on meetings and would like to know what you thought of the meeting with them. </p>


														<p style="color:#625675;font-size:16px;text-align:left;line-height:   25px;font-weight:normal"> Want to ensure you get the most out of meetings? <a target=_blank href="https://goodmeeting.today"> Create your own account here and have a GoodMeeting.Today </a> </p>
                                                </td>
                                            </tr>


                                            </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</div>

</div>
</body>
</html>`;
