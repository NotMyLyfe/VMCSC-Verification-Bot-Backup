const {discordUsers, discordServers} = require('./schema.js');
const client = require('./discordClient.js');

async function queryDb(){
    while(true){
        const users = await discordUsers.find();
        const servers = await discordServers.find();
        for(let [key, value] of client.guilds.cache){
            const details = servers.filter(server => server.serverId == key);
            if(details.length == 0) {
                await discordServers.create({
                    serverId: key,
                    messagePrefix: "--",
                    verifiedRole: "-1",
                    verificationChannels: [],
                    administratorRoles: []
                });
                continue;
            }
            const verifiedRole = details[0].verifiedRole;
            if(verifiedRole == "-1") continue;
            if(value.roles.cache.find(r => r.id == verifiedRole) == undefined){
                value.systemChannel.send("Verified role has been removed from the server, please update verified role.");
                await discordServers.updateOne({serverId : key}, {verifiedRole: "-1"});
                return;
            }
            for(let [mKey, mValue] of value.members.cache){
                const userDetails = users.filter(user => user.discordId == mKey);
                if(userDetails.length == 0 || mValue._roles.includes(verifiedRole) || mValue.user.bot) continue;
                try{
                    mValue.setNickname(userDetails[0].name);
                    mValue.roles.add(verifiedRole);
                }
                catch(err){
                    console.log(err, value.me.hasPermission('MANAGE_ROLES'));
		    continue;
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

module.exports = queryDb;
