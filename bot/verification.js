require("dotenv").config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const {discordUsers} = require('./schema.js');

app.get('/verify/:id', async (req, res, next) => {
    try{
        let decoded = jwt.verify(req.params.id, process.env.JWT_SECRET);
        let discordID = decoded.discordID;
        let studentNumber = decoded.studentNumber;
        let fullname = decoded.name;
        await discordUsers.findOneAndUpdate(
	{discordId: discordID}
	,{
            name: fullname,
            discordId: discordID,
            email: `${studentNumber}@student.publicboard.ca`
        },
	{
	    new: true,
	    upsert: true
	});
        res.status(200).send('Alright! You have been verified!');
    }
    catch(error){
        return next(error);
    }
});

app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('Token is invalid');
});

app.listen(3000, ()=>{
    console.log('Listening on port 3000');
});
