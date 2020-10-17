const {discordServers} = require('../schema.js');

module.exports = {
    name: 'addadmin',
    description : "Set administrator roles",
    args: -2,
    adminOnly: true,
    async execute(message, args){
        let channelIds = [];
        for(let ids of args){
            if(!ids.startsWith('<@&') || !ids.endsWith('>')){
                message.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            channelIds.push(ids.substr(2, ids.length - 3));
        }
        await discordServers.updateOne({serverId : message.guild.id}, {$addToSet: {verificationChannels : {$each : channelIds}}});
        message.channel.send('Alright, administrator roles have been updated.');
    }
}
