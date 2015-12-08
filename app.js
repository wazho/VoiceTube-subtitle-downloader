/*

 ____        _                        _            
/ ___|  __ _| |_ __ ___   ___  _ __  | |___      __
\___ \ / _` | | '_ ` _ \ / _ \| '_ \ | __\ \ /\ / /
 ___) | (_| | | | | | | | (_) | | | || |_ \ V  V / 
|____/ \__,_|_|_| |_| |_|\___/|_| |_(_)__| \_/\_/  

	Author: Ze-Hao, Wang (Salmon)
	GitHub: http://github.com/grass0916
	Site:   http://salmon.tw

	Copyright 2015 Salmon
	Released under the MIT license

*/

var async = require('async');
var vtdl  = require('./src/voicetube-dl.js');

var videoNum = [31602, 31874, 31171];

async.mapSeries(videoNum, function (number, callback) {
	vtdl.download(number, function (err) {
		return callback(err);
	});
}, function (err) {
	err && console.log('ERROR - ' + err);
});