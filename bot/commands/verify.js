const {discordUsers} = require('../schema.js');
const data = require('../data.json');

module.exports = {
    name: 'verify',
    description : "Used to verify status of Discord users through Microsoft365",
    args: 0,
    adminOnly: false,
    async execute(message, args){
        if(await discordUsers.findOne({discordId : message.member.id})) 
            message.member.send("You've already been verified by MasseyBot, no need to verify yourself again.");
        else 
            message.member.send(`To verify yourself, please click this link: ${data.redirectUrl}${message.member.id} (Note that once you verify yourself once, all servers with MasseyBot will auto verify you)`);
        return;
    }
}