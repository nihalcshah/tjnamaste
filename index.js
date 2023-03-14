var express = require('express')
var app = express();
var ejs = require('ejs');
ejs.open = '{{';
ejs.close = '}}';

const session = require('express-session');

app.use(session({
  secret: 'absdfasdlkjlkueoi68768',
  resave: false,
  name:"Sdf",
  saveUninitialized: false,
  // cookie: { secure: true }
}))

app.set('view engine','ejs')

app.use(
    express.static('static_files')
)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const home = require('./routes/home.js')
app.use(home);

// -------------- listener -------------- //
// The listener is what keeps node 'alive.' 

var listener = app.listen(process.env.PORT || 8080, process.env.HOST || "0.0.0.0", function() {
    console.log("Express server started");
    console.log("Visit http://localhost:8080/")
});