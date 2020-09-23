const {discordServers} = require('../schema.js');

module.exports = {
    name: 'setverifiedrole',
    description : "Sets the role for which verified users receive",
    args: 1,
    adminOnly: true,
    async execute(message, args){
        const serverInfo = await discordServers.findOne({serverId : message.guild.id});
        if(!args[0].startsWith('<@&') || !args[0].endsWith('>')){
            message.channel.send(`That's not a valid argument, please specify a role in the argument.`);
            return;
        }
        const verifiedRoleId = args[0].substr(3, args[0].length - 4);
        var name;
        try{
            name = message.guild.roles.cache.get(verifiedRoleId).name;
        }
        catch(error){
            message.channel.send('There was an error trying to update verified role');
            return;
        }
        if(verifiedRoleId != serverInfo.verifiedRole){
            await discordServers.updateOne({serverId : message.guild.id}, {verifiedRole: verifiedRoleId});
            message.channel.send(`Alright, verified role has been updated to \`${name}\``);
        }
        else{
            message.channel.send(`Verified role is already set to \`${name}\``);
        }
    }
}