const express = require('express');
const router = express.Router()
var https = require('https');
var mysql = require('mysql');
const passport = require('passport');
// var userProfile;

router.use(passport.initialize());
router.use(passport.session());

const GoogleStrategy = require('passport-google-oauth2').Strategy;
const GOOGLE_CLIENT_ID = '534264978436-20idlfgt8bo225hss0tg8oal6mmh5c19.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      // userProfile=profile;
      return done(null, profile);
  }
));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

var pool =  mysql.createPool({
    host     : '127.0.0.1',
    user     : 'cjzulu',
    password : 'snsnnine',
    database : 'namaste'
});    

// const client = new AuthorizationCode(oauth_params);

function sqlPromise(pool, sqlQuery, params) {
    return new Promise(function(resolve,reject){
        pool.query(sqlQuery,params, function(error,results,fields){
            if (error) throw error;
            resolve(results)
        })
    })
}

//Error in authentication
router.get('/error', (req, res) => res.send("error logging in"));

router.get('/', function(req, res){
    res.render('home')
});

//Allow for authentication through google.
router.get('/process', passport.authenticate('google', { scope : ['profile', 'email'] }))



router.get('/google/callback', 
  //Callback Sign In
  passport.authenticate('google', { failureRedirect: '/error' }),
  async function(req, res) {
    //Check if user has already bought tickets
    var sqlQuery = "SELECT * FROM Users WHERE Email=?;";
    let sqloutput = await sqlPromise(pool, sqlQuery, [req.session.passport.user['email']]);
    if (sqloutput.length>0){
      req.session.previousUser = sqloutput;
      return res.redirect('/complete');
    }
    res.redirect('/tickets');
  }
);

//Database Insertion

// const fs = require('fs');
// var data;
// try {
//   data = fs.readFileSync('.//static_files//seats.txt', 'utf8');
//   // console.log(data);
// } catch (err) {
//   console.error(err);
// }

// var seatarr = data.split("\r\n")
// router.get('/addtix', async function(req, res){

//   for(var i =0; i<seatarr.length; i++){
//     var sqlQuery = "INSERT INTO Seats (SeatID) VALUES (?);";
//     let inserted = await sqlPromise(pool, sqlQuery, [seatarr[i]]);
//   }
//   res.redirect('tickets');
// });



router.get('/tickets', async function(req, res){
  //Check if Signed IN
  if(!req.session.passport){
    return res.redirect('process')
  }
  //Check if bought before
  if(req.session.previousUser){
    return res.redirect('complete');
  }
  //Allow Ticket Order
  res.render('ticket', {"amount":0});
});

router.post('/validity',async function(req, res){
  //Check if seats are in database (FETCH)
  var sqlQuery = "SELECT 1 FROM Seats WHERE SeatID=?;";
  let sqloutput = await sqlPromise(pool, sqlQuery, [req.body['seat']]);
  if (sqloutput.length>0){
    return res.json({"valid":true})
  }else{
    return res.json({"valid":false})
  }
});

router.get('/complete', async function(req, res){
  //Check if signed in
  if(!req.session.passport){
    return res.redirect('process')
  }
  //Check if have bought before
  if(req.session.previousUser){
    let objd = {"seatstring":req.session.previousUser[0]['Tickets']}
    return res.render("complete", objd)
  } 

  //Delete chosen seats and add new seats to seatstring.
  var seatstring = ""
  for(var i =1;i<=req.query['ticketcount']; i++){
    var sqlQuery = "DELETE FROM Seats WHERE SeatID=?;";
    let deleted = await sqlPromise(pool, sqlQuery, [req.query['seat'+i]]);
    seatstring+=req.query['seat'+i] + " "
  }
  //Add new User
  var sqlQuery = ' insert into Users (Email, TicketCount, Name, Tickets) values (?, ?, ?, ?);'
  let created = await sqlPromise(pool, sqlQuery, [req.session.passport.user['email'], req.query['ticketcount'], req.query['name'], seatstring]);
  //Proxy User to make sure you cant purchase new tickets
  req.session.previousUser = [{'Tickets':seatstring}]
  return res.render("complete", {"seatstring":seatstring})
});

module.exports = router;