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
    const serverInfo = await discordServers.findOne({serverId : member.guild.id});
    if(userInfo){
        member.send(`Welcome to ${member.guild.name}! Since you've already verified yourself with MasseyBot, no need to verify yourself again.`);
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
        member.send(`Welcome to ${member.guild.name}! Please verify yourself in the server by typing \`${serverInfo.messagePrefix}verify (your student ID) (Your first and last name)\``);
    }
});

client.on('message', async msg => {
    if(msg.author.bot) return;

    if(msg.channel.type == 'dm'){
        const args = msg.content.trim().split(' ');
        const command = args.shift().toLowerCase();
        try{
            if(command.includes('help') || command.includes('verify')){
                const commandObj = (command.includes('help')) ? client.commands.get('help') : client.commands.get('verify');
                if(commandObj.args >= 0 && args.length != commandObj.args){
                    msg.author.send(`\`${command}\` requires \`${commandObj.args}\` argument(s)`);
                }
                else{
                    await commandObj.execute(msg, args);
                }
            }
            else{
                msg.author.send("That command is an invalid command.")
            }
        }
        catch(err){
            console.error(err);
            msg.author.send('There was an error trying to excute that command!');
        }
        return;
    }

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

    if(serverInfo.verificationChannels.length > 0 && !serverInfo.verificationChannels.includes(msg.channel.id)) return;
   
    if(!msg.content.startsWith(messagePrefix)){
	if(!msg.member.hasPermission('ADMINISTRATOR') && !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val)))
            msg.delete();
	return;
    }

    const args = msg.content.slice(messagePrefix.length).trim().split(' ');
    const command = args.shift().toLowerCase();
    
    if(!client.commands.has(command)){
        msg.member.send(`\`${messagePrefix}${command}\` is not a valid command, please refer to \`${messagePrefix}help\` for a list of commands`);
        return;
    }
    
    const commandObj = client.commands.get(command);
    
    if(commandObj.adminOnly && !(msg.member.hasPermission('ADMINISTRATOR')) && !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val))){
        msg.member.send('You do not have permission to access that command!');
        return;
    }

    if(commandObj.args >= 0 && args.length != commandObj.args){
        msg.member.send(`\`${messagePrefix}${command}\` requires \`${commandObj.args}\` argument(s)`);
        return;
    }

    if(commandObj.args < 0 && args.length < commandObj.args * -1 - 1){
        msg.member.send(`\`${messagePrefix}${command}\` requires at least \`${commandObj.args * -1 - 1}\` argument(s)`);
        return;
    }

    try{
        await commandObj.execute(msg, args);
    } catch(error){
        console.error(error);
        msg.member.send('There was an error trying to execute that command!');
    }
    
    if(!msg.member.hasPermission('ADMINISTRATOR') && !serverInfo.administratorRoles.some(val => msg.member._roles.includes(val))){
        msg.delete();
    }
});

queryDb();
