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
        await discordUsers.create({
            name: fullname,
            discordId: discordID,
            email: `${studentNumber}@student.publicboard.ca`
        })
        res.status(200).send('Alright! You have been verified!');
    }
    catch(error){
        return next(error);
    }
});

app.use(function(err, req, res, next) {
    res.status(500).send('Something broke!');
});

app.listen(3000, ()=>{
    console.log('Listening on port 3000');
});
