const {discordServers, discordUsers} = require('./schema.js');
const queryDb = require('./query.js');
const client = require('./discordClient.js');

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
    
    if(!client.commands.has(command)){
        msg.channel.send(`\`${messagePrefix}${command}\` is not a valid command, please refer to \`${messagePrefix}help\` for a list of commands`);
        return;
    }
    
    const commandObj = client.commands.get(command);

    console.log(commandObj.adminOnly, !(msg.member.hasPermission('ADMINISTRATOR')), !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val)));

    if(commandObj.adminOnly && !(msg.member.hasPermission('ADMINISTRATOR')) && !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val))){
        msg.reply('you do not have permission to access that command');
        return;
    }

    if(commandObj.args >= 0 && args.length != commandObj.args){
        msg.channel.send(`\`${messagePrefix}${command}\` requires \`${commandObj.args}\` argument(s)`);
        return;
    }

    if(commandObj.args < 0 && args.length < commandObj.args * -1 - 1){
        msg.channel.send(`\`${messagePrefix}${command}\` requires at least \`${commandObj.args * -1 - 1}\` argument(s)`);
        return;
    }

    try{
        await commandObj.execute(msg, args);
    } catch(error){
        console.error(error);
        msg.reply('there was an error trying to execute that command!');
    }
});

queryDb();