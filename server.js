var express = require('express'),
    app = express(), 
    mongo = require("mongodb"), 
    path = require("path"),
    short = require("./short"),
    mongo = require('mongodb').MongoClient,
    mongoUrl = 'mongodb://localhost:27017/sites';

mongo.connect(mongoUrl, function(err, db) {
    if(err) throw err;
    
    db.createCollection("sites", {
        capped: true,
        size: 5242880,
        max: 5000
    });
    
    function linkGen() {
        var num = Math.floor(100000 + Math.random() * 900000);
        return num.toString().substring(0, 4);
    }

    function addLink(url, res, db) {
        var addedUrl = linkGen();
        var site = {
            "longUrl": url,
            "shortUrl": addedUrl
        };
        var sites = db.collection('sites');
        sites.insert(site, function(err, data) {
            if(err) throw err;
        });
        console.log("Added the link " + addedUrl);
        //res.send("Your new short link is: " + addedUrl);
        res.send("{'longUrl': " + url + ", 'shortUrl': " + addedUrl + "}");
    }

    function handleLong(url, res, db) {//make this handleLong and make another handle short
        var sites = db.collection('sites');
        sites.findOne({
            "longUrl": url
        }, function(err, result) {
            if(err) {
                res.send(err);
                throw err;
            }
            if(result) {
                console.log("Shorturl already exists! its short url is " + result.shortUrl)
                //res.send("The short url is: " + result.shortUrl);
                res.send(result);
            } else {
                console.log('Site not found... Adding it.');
                addLink(url, res, db);
            }
        });
    }
    
    function handleShort(url, res, db) {
        var sites = db.collection('sites');
        sites.findOne({
            "shortUrl": url
        }, function(err, result) {
            if(err) {
                res.send(err);
                throw err;
            }
            if(result) {
                console.log('Found ' + result);
                if(!/^((http[s]?|ftp):\/)?\/?/g.test(result.longUrl)) {
                    res.redirect(result.longUrl);
                    console.log('Redirecting to: ' + result.longUrl);
                } else {
                    res.redirect("https://" + result.longUrl);
                    console.log('Redirecting to: https://' + result.longUrl);
                }
                //console.log('Redirecting to: ' + result.longUrl);
                //res.redirect("https://" + result.longUrl);
                //res.redirect(result.longUrl);
            } else {
                console.log('Site not found...');
                //res.send("Not found... Please make a short url by putting in the full url");
                res.send("{'error': Site not found}")
            }
        });
    }
    
    function validateURL(url) {
        //return /([0-9]){4}\b/g.test(url);
        //return /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/.test(url);
        //if(url.length >= 2 && url.length <= 6) return false;
        //else return true;
        var regex = /^((https)|(w){3}?)([:.])+(\/){0,2}([0-9]|[a-z]){1,}/g
        return regex.test(url);
    }
    
    app.get('/:url', function(req, res) {
        var url = req.params.url;
        if (req.url != '/favicon.ico') {
            console.log(url);
            if(validateURL(url)) {
                handleLong(url, res, db);
            } else {
                handleShort(url, res, db);
            }
        }
    });
    
    app.listen(8082);
});