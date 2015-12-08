/* =============================================
                    Packages
   ============================================= */

// Native libraries below.
var modules = {};
modules.readline = require('readline');
modules.path     = require('path');
modules.http     = require('http');
// 3rd-party libraries below.
modules.async       = require('async');
modules._           = require('underscore');
modules.fs          = require('graceful-fs');
modules.request     = require('request');
modules.cheerio     = require('cheerio');
modules.ytdl        = require('ytdl-core');
modules.progress    = require('progress-stream');
modules.progressBar = require('progress');

var exports = module.exports = {};

var DEST_OUTPUT    = 'outputs';
var VOICETUBE_LINK = 'https://tw.voicetube.com/videos/';
var YOUTUBE_LINK   = 'http://www.youtube.com/watch?v=';

exports.download = function download(num, callback) {
	modules.async.waterfall([
		// Initial.
		function (callback) {
			// Outputs folder.
			modules.fs.stat(DEST_OUTPUT, function (err, stats) {
				if (err) {
					modules.fs.mkdir(DEST_OUTPUT);
				}
				return callback(null);
			});
		},
		// Grab the HTML.
		function (callback) {
			var options = {
				url     : VOICETUBE_LINK + num,
				headers : {'user-agent': 'Mozilla/5.0'},
			};
			modules.request(options, function (err, res, body) {
				if (err) {
					return callback(err);
				}
				return callback(null, body, num);
			});
		},
		// Parse the HTML.
		function (html, num, callback) {
			var $ = modules.cheerio.load(html);
			// Get video title.
			var title = $('.video-title').text();
			// Get YouTube url (Hide in javascript).
			var youtubeCode = html.match(/var youtube_id = \'(.+)\';/)[1];
			// Get sequences.
			var sequences = $('table[id=\'show-caption-table\'] tr td > span');
			sequences = modules._.map(sequences, function (sequence, i) {
				var second   = sequence.attribs && sequence.attribs['start'];
				var subtitle = $(sequence).text();
				return { 'second' : second, 'text' : subtitle };
			});
			// JSON to CSV format.
			var csv = '';
			modules._.map(sequences, function (sequence, i) {
				csv += (sequence.second + ',\"' + sequence.text.replace(/"/g, '\\"') + '\"\n');
			});
			// Generate output files.
			var fileName = DEST_OUTPUT + '/' + num + '.csv';
			modules.fs.writeFile(fileName, csv, 'utf8', function (err) {
				if (err) {
					return callback(err);
				}
				return callback(null, num, youtubeCode);
			});
		},
		// Download Youtube vedio.
		function (num, youtubeCode, callback) {
			var videoName = DEST_OUTPUT + '/' + num + '.mp4';
			// Progress settings.
			var bar = new modules.progressBar('\'' + videoName + '\' is downloading [:bar] :percent :etas', { total: 25 });
			// Create first file.
			modules.fs.writeFile(videoName, ' ', 'utf8', function (err) {
				// Activate progress bar.
				var str = modules
					.progress({
						length : modules.fs.statSync(videoName),
						time   : 100
					})
					.on('progress', function (progress) {
						bar.tick(progress.percentage / 100 * 25);
					});
				// Start to download.
				var video = modules
					.ytdl(YOUTUBE_LINK + youtubeCode)
					.pipe(str)
					.pipe(modules.fs.createWriteStream(videoName));
				video.on('finish', function () {
					return callback(null);
				});
			});
		}
	], function (err) {
		return callback(err);
	});
};