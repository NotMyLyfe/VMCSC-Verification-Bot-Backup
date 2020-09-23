const {discordServers} = require('../schema.js');

module.exports = {
    name: 'removeadmin',
    description : "Remove roles that have administrator privileges from this bot",
    args: -2,
    adminOnly: true,
    async execute(message, args){
        let roleIds = [];
        for(let ids of args){
            if(!ids.startsWith('<@&') || !ids.endsWith('>')){
                message.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            roleIds.push(ids.substr(3, ids.length - 4));
        }
        await discordServers.updateOne({serverId : message.guild.id}, {$pullAll: {administratorRoles : roleIds}});
        message.channel.send('Alright, administrator roles have been updated.');
    }
}