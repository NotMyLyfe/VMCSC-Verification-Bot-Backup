const {discordServers} = require('../schema.js');

module.exports = {
    name: 'removechannels',
    description : "Remove channels that this bot will accept messages in",
    args: -2,
    adminOnly: true,
    async execute(message, args){
        let channelIds = [];
        for(let ids of args){
            if(!ids.startsWith('<#') || !ids.endsWith('>')){
                message.channel.send(`That's not a valid argument, please specify a channel in the argument(s).`);
                return;
            }
            channelIds.push(ids.substr(2, ids.length - 3));
        }
        await discordServers.updateOne({serverId : message.guild.id}, {$pullAll: {verificationChannels : channelIds}});
        message.channel.send('Alright, bot channels have been updated.');
        return;
    }
}