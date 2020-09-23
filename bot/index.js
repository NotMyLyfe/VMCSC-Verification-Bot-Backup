const commandsAndInfo = require('./commandsInfo.json');
const {discordServers, discordUsers} = require('./schema.js');
const queryDb = require('./query.js');
const client = require('./discordClient.js');

const redirectUrl = "http://localhost:3000/login/"

client.on('guildCreate', async guild=>{
    let prefix = "--";
    const ifSeverAlreadyExists = await discordServers.findOne({serverId : guild.id});
    if(ifSeverAlreadyExists){
        prefix = ifSeverAlreadyExists.messagePrefix;
    }
    else{
        await discordServers.create({
            serverId: guild.id,
            messagePrefix: prefix,
            verifiedRole: "-1",
            verificationChannels: [],
            administratorRoles: []
        });
    }
    guild.systemChannel.send(`Hello! I'm **MasseyBot**!\nTo get started, type \`${prefix}help\`.\nAny questions? Feel free to message me on Discord, my username is \`NotMyLyfe#3937\``);
});

client.on('guildMemberAdd', async member =>{
    const userInfo = await discordUsers.findOne({discordId : member.id});
    if(userInfo){
        member.send(`Welcome to ${member.guild.name}! Since you've already verified yourself with MasseyBot, no need to verify yourself again.`);
        const serverInfo = await discordServers.findOne({serverId : member.guild.id});
        try{
            member.setNickname(userInfo.name);
            if(serverInfo && serverInfo.verifiedRole != "-1" || member.guild.roles.cache.find(r => r.id == serverInfo.verifiedRole != undefined)){
                member.roles.add(serverInfo.verifiedRole);
            }
        }
        catch(err){
            console.log(err, member.guild.me.hasPermission('MANAGE_ROLES'));
        }
    }
    else{
        member.send(`Welcome to ${member.guild.name}! To verify yourself, please click this link: ${redirectUrl}${member.id}`);
    }
});

client.on('message', async msg => {
    if(msg.author.bot) return;
    
    let serverInfo = await discordServers.findOne({serverId : msg.guild.id});

    if(!serverInfo){
        await discordServers.create({
            serverId: msg.guild.id,
            messagePrefix: '--',
            verifiedRole: "-1",
            verificationChannels: [],
            administratorRoles: []
        });
        serverInfo = {
            serverId : msg.guild.id,
            messagePrefix: '--',
            verifiedRole: "-1",
            verificationChannels: [],
            administratorRoles: []
        };
    }
    const messagePrefix = serverInfo.messagePrefix;

    if(!msg.content.startsWith(messagePrefix) || (serverInfo.verificationChannels.length > 0 && !serverInfo.verificationChannels.includes(msg.channel.id))) return;
    
    const args = msg.content.slice(messagePrefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
    const detailsAboutCommand = commandsAndInfo.filter(commands => commands.command.toLowerCase() == command);
    
    if(detailsAboutCommand.length == 0){
        msg.channel.send(`\`${messagePrefix}${command}\` is not a valid command, please refer to \`${messagePrefix}help\` for a list of commands`);
        return;
    }

    const requiresAdminPerms = detailsAboutCommand[0].adminOnly;
    if(requiresAdminPerms && !(msg.member.hasPermission('ADMINISTRATOR')) && !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val))){
        msg.reply('you do not have permission to access that command');
        return;
    }
    let reqArgs = detailsAboutCommand[0].args
    const unlimitedArgs = reqArgs < 0;
    if (unlimitedArgs) reqArgs = reqArgs * -1 - 1;

    if(!unlimitedArgs && args.length != reqArgs){
        msg.channel.send(`\`${messagePrefix}${command}\` requires \`${reqArgs}\` argument(s)`);
        return;
    }
    if(unlimitedArgs && args.length < reqArgs){
        msg.channel.send(`\`${messagePrefix}${command}\` requires at least \`${reqArgs}\` argument(s)`);
        return;
    }

    if(command == 'help'){
        var reply = '```Commands:'
        for(let commands of commandsAndInfo){
            reply += `\n\n${commands.command}\nDescription: ${commands.description}\nAdmin Only: ${commands.adminOnly}\n`;
            if(commands.args >= 0) reply += `Required arguments: ${commands.args}`;
            else reply += `Minimum arguments: ${commands.args * -1 - 1}`;
        }
        reply += '\n\nStill need help? Feel free to privately message me at NotMyLyfe#3937```';
        msg.member.send(reply);
        return;
    }
    
    if(command == 'verify'){
        if(await discordUsers.findOne({discordId : msg.member.id})) msg.member.send("You've already been verified by MasseyBot, no need to verify yourself again.");
        else msg.member.send(`To verify yourself, please click this link: ${redirectUrl}${msg.member.id} (Note that once you verify yourself once, all servers with MasseyBot will auto verify you)`);
        return;
    }

    if(command == 'setprefix'){
        if(messagePrefix != args[0]){
            await discordServers.updateOne({serverId : msg.guild.id}, {messagePrefix : args[0]});
            msg.channel.send(`Alright, bot prefix has been updated to \`${args[0]}\``);
            return;
        }
        else{
            msg.channel.send(`Prefix is already set to \`${args[0]}\``);
        }
    }

    if(command == 'setverifiedrole'){
        if(!args[0].startsWith('<@&') || !args[0].endsWith('>')){
            msg.channel.send(`That's not a valid argument, please specify a role in the argument.`);
            return;
        }
        const verifiedRoleId = args[0].substr(3, args[0].length - 4);
        if(verifiedRoleId != serverInfo.verifiedRole){
            await discordServers.updateOne({serverId : msg.guild.id}, {verifiedRole: verifiedRoleId});
            msg.channel.send(`Alright, verified role has been updated to \`${msg.guild.roles.cache.get(verifiedRoleId).name}\``);
        }
        else{
            msg.channel.send(`Verified role is already set to \`${msg.guild.roles.cache.get(verifiedRoleId).name}\``);
        }
        return;
    }

    if(command == 'addadmin'){
        let roleIds = [];
        for(let ids of args){
            if(!ids.startsWith('<@&') || !ids.endsWith('>')){
                msg.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            roleIds.push(ids.substr(3, ids.length - 4));
        }
        await discordServers.updateOne({serverId : msg.guild.id}, {$addToSet: {administratorRoles : {$each : roleIds}}});
        msg.channel.send('Alright, administrator roles have been updated.');
        return;
    }

    if(command == 'removeadmin'){
        let roleIds = [];
        for(let ids of args){
            if(!ids.startsWith('<@&') || !ids.endsWith('>')){
                msg.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            roleIds.push(ids.substr(3, ids.length - 4));
        }
        await discordServers.updateOne({serverId : msg.guild.id}, {$pullAll: {administratorRoles : roleIds}});
        msg.channel.send('Alright, administrator roles have been updated.');
        return;
    }

    if(command == 'setchannels'){
        let channelIds = [];
        for(let ids of args){
            if(!ids.startsWith('<#') || !ids.endsWith('>')){
                msg.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            channelIds.push(ids.substr(2, ids.length - 3));
        }
        await discordServers.updateOne({serverId : msg.guild.id}, {$addToSet: {verificationChannels : {$each : channelIds}}});
        msg.channel.send('Alright, bot channels have been updated.');
        return;
    }

    if(command == 'removechannels'){
        let channelIds = [];
        for(let ids of args){
            if(!ids.startsWith('<#') || !ids.endsWith('>')){
                msg.channel.send(`That's not a valid argument, please specify a role in the argument(s).`);
                return;
            }
            channelIds.push(ids.substr(2, ids.length - 3));
        }
        await discordServers.updateOne({serverId : msg.guild.id}, {$pullAll: {verificationChannels : channelIds}});
        msg.channel.send('Alright, bot channels have been updated.');
        return;
    }
});

queryDb();