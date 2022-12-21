const express = require('express');
var router = express.Router();

var events = [
    {
        "event_name": "Movie Night",
        "date": "Upcoming F"
    },
];

router.get('/', function(req, res){
    res.render('home');
});

router.get('/about',function(req, res){
    res.render('about')
});

let officers = {
    // "officers":{
    //     ""
    // }
    
}


module.exports = router;