require('dotenv').config();
var mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_APIKEY, domain: process.env.DOMAIN});
let SendMail = {}

SendMail.sendMail = function (email, token, name){
    return new Promise(function(resolve, reject){
        let link = `https://verify.vmcs.club/verify/${token}`
        console.log(link);
        const msg = {
            to: email,
            from: process.env.FROM_EMAIL, // Use the email address or domain you verified above
            subject: 'Massey Computer Science Club Verification',
            text: `Hello ${name}!\n\nThank you for joining the Vincent Massey Secondary School Computer Science Club 2020-2021 Discord server.\n\nIn order to maintain member privacy and security, we are requiring all users to verify themselves with their student email. To complete your account verification, please visit ${link} .\n\nIf you are in need of any assistance, please contact a Discord administrator. We look forward to another year of computer science at Vincent Massey!`,
            html: `Hello ${name}!<br><br>Thank you for joining the Vincent Massey Secondary School Computer Science Club 2020-2021 Discord server.<br><br>In order to maintain member privacy and security, we are requiring all users to verify themselves with their student email. To complete your account verification, please <a href="${link}">click here</a>.<br><br>If you are in need of any assistance, please contact a Discord administrator. We look forward to another year of computer science at Vincent Massey!`
          };

        mailgun.messages().send(msg, function (error, body) {
            console.log(body);
            if(error){
                return reject(error);
            }
            return resolve();
        });
    })
    
}

module.exports = SendMail;
