require('dotenv').config();
const {discordUsers} = require('../schema.js');
const jwt = require('jsonwebtoken');
const SendMail = require('../sendmail');

module.exports = {
    name: 'verify',
    description : "Used to verify status of Discord users through Microsoft365",
    args: 3,
    adminOnly: false,
    async execute(message, args){
        if(await discordUsers.findOne({discordId : message.member.id})) 
            message.member.send("You've already been verified by MasseyBot, no need to verify yourself again.");
        else{
            let studentNumber = args[0];
            if(studentNumber.length != 8){
                message.member.send("The ID you have sent is not a valid ID, please send a valid ID (your valid 8 digit ID)");
		return;
            }
            let fullname = `${args[1]} ${args[2]}`;
            let token = jwt.sign({
                discordID: message.member.id,
                studentNumber: studentNumber,
                name: fullname
            }, process.env.JWT_SECRET);
            let verifyEmail = `${studentNumber}@student.publicboard.ca`;
            console.log(verifyEmail);
            SendMail.sendMail(verifyEmail, token, fullname).then(() => {
                message.member.send(`We have sent an email to ${verifyEmail}. Please check your Office365 email and click the link to complete verification. If you do not see it in your Inbox, **check your Junk Email folder** and report it as not junk!`);
	    })
            .catch(() => {
                message.member.send('There was an error sending your verification email. Please message a Discord Admin to complete manual verification.');
	    });
        }
	
        return;
    }
}
