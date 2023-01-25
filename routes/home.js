const express = require('express');
const router = express.Router()
var https = require('https');
var mysql = require('mysql');

const {  AuthorizationCode } = require('simple-oauth2');

var pool =  mysql.createPool({
    host     : '127.0.0.1',
    user     : 'cjzulu',
    password : 'snsnnine',
    database : 'namaste'
});    

const ion_client_id = 'IgiMVwzHt9DkW2exOKD95jDnB1oZi7bboZ9ptJhR';
const ion_client_secret = 'jvZ5WU0ZcQFYDq4tcaeoOi5Bi8awW9zgapH9Z5NN6v0oeYSA8QoPQc4X5sU37IEHmoCdmZPXqD0aQvsiNzn9FxDc5SYqouFo8MjwlnkSaJ9HdrZUGbE3RBjvkTDFXyOF';

const oauth_params = {
    client: {
      id: ion_client_id,
      secret: ion_client_secret,
    },
    auth: {
      tokenHost: 'https://ion.tjhsst.edu/oauth/',
      authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
      tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
    }
}
  
const client = new AuthorizationCode(oauth_params);

function sqlPromise(pool, sqlQuery, params) {
    return new Promise(function(resolve,reject){
        pool.query(sqlQuery,params, function(error,results,fields){
            if (error) throw error;
            resolve(results)
        })
    })
  }

router.get('/', function(req, res){
    const login_link_creator_params = {
        'scope': "read",
        'redirect_uri': 'http://localhost:8080/oauth/' 
    }
    if('accessToken' in req.session && 'authenticated' in req.session){
        res.render('home', {'logged_in' : true})
        return
    }
    
    const authorizationUri = client.authorizeURL(login_link_creator_params);
    console.log(authorizationUri);
    res.render('home', {'login_link' : authorizationUri})
});

router.get('/oauth', async function(req, res) { 

    let theCode = req.query.code;
    let accessToken;
    console.log(theCode)
    const get_token_options = {
      'code': theCode,
      'redirect_uri': 'http://localhost:8080/oauth/',
      'scope': 'read'
    };
    
    // needed to be in try/catch
    try {
      // recall that await serializes asyncronous fcn call
      accessToken = await client.getToken(get_token_options);
    } 
    catch (error) {
        console.log('Access Token Error', error.message);
        res.send(502); // bad stuff, man
        return
    }

    req.session.accessToken = accessToken;
    req.session.authenticated = true;
    res.redirect("http://localhost:8080/")
});

function downloader_promise(url) {
    return new Promise( function(resolve,reject){
      https.get(url, function(response) {
        var rawData = '';
        response.on('data', function(chunk) { rawData+=chunk; })
        response.on('end', function() { resolve(rawData); })
      }).on('error', function(e) {
        reject(e)
      });
    })
}

router.get('/edit', async function(req, res) { 
    validUsers = [
        '2023nshah',
        '2023pshan',
        '2023nshyamala',
        '2023aaneja',
        '2023njayapal',
        '2025emoorthy',
        '2024lmedhuri',
    ]

    let token = req.session.accessToken.access_token
    const profile_url = `https://ion.tjhsst.edu/api/profile?format=json&access_token=${token}`
    let profile_string = await downloader_promise(profile_url);
    let profile = JSON.parse(profile_string)
    if('detail' in profile&& profile['detail']=='Authentication credentials were not provided.'){
      req.session.authenticated = false;
      req.session.authorized = false;
      res.clearCookie("accessToken");
      res.redirect('/');
      return
    } 
    console.log(profile['ion_username'])
    console.log( validUsers.includes(profile['ion_username']))

    if(validUsers.includes(profile['ion_username'])){
        req.session.authorized = true;
        var sqlQuery = 'select * from events;'
        let k = await sqlPromise(pool, sqlQuery)

        var totallist = [

        ]

        k.forEach(function (item, index) {
            const evdate = new Date(item['eventtime']);
            let temp = evdate.toDateString()+" | "+item['eventtype']+" | "+item['Event']
            totallist.push([temp, item["Event"]])

        });
        console.log(totallist);
        res.render('edit', {'name': profile['first_name'], "logged_in":true, "list":totallist})
        return
    }else{
        req.session.authenticated = false;
        req.session.authorized = false;
        res.clearCookie("accessToken");
        res.redirect('/')
        return
    }
    
});

router.post('/addevent', async function(req, res) { 
    var sqlQuery = 'insert into events (eventtype, event, eventtime) values (?, ?, ?);'
    console.log(sqlQuery)
    console.log(req.body['eventtype'])
    console.log(req.body['eventname'])
    console.log(req.body['date'])
    let k = await sqlPromise(pool, sqlQuery, [req.body['eventtype'], req.body['eventname'], req.body['date']])
    console.log(k);
    console.log("hi")
    res.redirect('/edit')
  });

  router.post('/remove', async function(req, res) { 
    var sqlQuery = 'DELETE FROM events WHERE event=?;'
    let k = await sqlPromise(pool, sqlQuery, [req.body['event']])
    res.send("3")
  });


module.exports = router;