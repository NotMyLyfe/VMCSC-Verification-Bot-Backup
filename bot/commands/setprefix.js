const {discordServers} = require('../schema.js');

module.exports = {
    name: 'setprefix',
    description : "Changes the prefix that will trigger this bot",
    args: 1,
    adminOnly: true,
    async execute(message, args){
        const serverInfo = await discordServers.findOne({serverId : message.guild.id});
        if(serverInfo.messagePrefix != args[0]){
            await discordServers.updateOne({serverId : message.guild.id}, {messagePrefix : args[0]});
            message.channel.send(`Alright, bot prefix has been updated to \`${args[0]}\``);
        }
        else{
            message.channel.send(`Prefix is already set to \`${args[0]}\``);
        }
    }
}