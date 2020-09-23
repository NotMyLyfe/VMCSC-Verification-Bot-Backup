const mongoose = require('mongoose');

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
    verifiedRole: {
        type: String,
        required: true
    },
    verificationChannels:{
        type: [String],
        required: true
    },
    administratorRoles: {
        type: [String],
        required: true
    }
})

let discordUsers = mongoose.model('DiscordUser', userSchema);
let discordServers = mongoose.model('DiscordServer', serverSchema);

module.exports = {discordServers, discordUsers};