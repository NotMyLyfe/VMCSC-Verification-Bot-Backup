require('dotenv').config();

const Discord = require('discord.js');
const mongoose = require('mongoose');
const client = new Discord.Client();

mongoose.connect('mongodb://localhost/vmcsc');
let db = mongoose.connection;

db.on('open', function(){
    console.log('Connected to MongoDB');
})

db.on('error', function(err){
    console.log(err);
});

let userSchema = mongoose.Schema({
    name:{
      type: String,
      required: true
    },
    discordId: {
      type: Number,
      required: true
    },
    email: {
      type: String,
      required: true
    }
});

let serverSchema = mongoose.Schema({
    serverId:{
        type: Number,
        required: true
    },
    messagePrefix:{
        type: String,
        required: true
    },
    ignoreRoles: {
        type: [Number],
        required: true
    },
    ignoreUsers: {
        type: [Number],
        required: true
    },
    verificationChannels:{
        type: [Number],
        required: true
    },
    administratorRoles: {
        type: [Number],
        required: true
    }
})

let discordUsers = mongoose.model('DiscordUser', userSchema);
let discordServers = mongoose.model('DiscordServer', serverSchema);

client.on('ready', () => {
    console.log('Ready!');
});

client.on('guildCreate', async guild=>{
    let prefix = "--";
    const ifSeverAlreadyExists = await discordServers.findOne({serverId : guild.id})
    console.log(ifSeverAlreadyExists);
    if(ifSeverAlreadyExists){
        prefix = ifSeverAlreadyExists.messagePrefix;
    }
    else{
        await discordServers.create({
            serverId: guild.id,
            messagePrefix: prefix,
            ignoreRoles: [],
            ignoreUsers: [],
            verificationChannels: [],
            administratorRoles: []
        })
    }
    guild.systemChannel.send(`Hello! I'm **MasseyBot**!\nTo get started, type \`${prefix}help\`.\nAny questions? Feel free to message me on Discord, my username is \`NotMyLyfe#3937\``);
});

client.on('message', async msg => {
    
});

client.login(process.env.TOKEN);