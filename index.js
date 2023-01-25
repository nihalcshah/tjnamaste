var express = require('express')
var app = express();
var ejs = require('ejs');
ejs.open = '{{';
ejs.close = '}}';

app.use(require('cookie-session')({
    name: 'namaste_cookie',
    keys: ['kasljdflkajdsl2342','3242kljlkjwflksdja', '23423lkj09aldjflj', "243oadsf9uvnad8", "987234ks0283904", "s23423jlk", "09009009009a"],
}));  


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