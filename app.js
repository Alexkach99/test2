'use strict';

const express = require('express');
const app = express();
const serv = require('http').Server(app);
const port = process.env.PORT || 3000;

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/client/index.html');
});

app.use('/', express.static(__dirname + '/client'));

serv.listen(port);
console.log('Server is listening on ' + port);