var express = require('express');
var router = express.Router();
var app = require('../app');
// var moment = require('moment');
//var redis = require('redis');
//var cache = redis.createClient();
var uuid = require('node-uuid');
var nodemailer = require('nodemailer');

var usersToAdd = [];
console.log(usersToAdd);


// router.get('/', function(request, response, next){
//   var username = null
//   database = app.get('database');

//   if (request.cookies.username != undefined){
//     username = request.cookies.username;
//   }
// })

//useing redis//////////////

//   cache.lrange('posts', 0, -1, function(err,cachePosts){
//     if (cachePosts.length < 1) {

//       database('posts').select().then(function(retrivedPosts){

//         cache.lpush('posts', retrivedPosts);

//         response.render('index', {title: 'DERP', username: username, posts: retrivedPosts});
//       })
//     }else{
//       response.render('index', {title: 'DERP', username: username, posts: cachePosts[0]});
//     }
//   })
//+++++++++++++++++++++++++++



// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/', function(request, response, next) {
  var username = null;
  /*
  Check to see if a user is logged in. If they have a cookie called
  "username," assume it contains their username
  */

  if (request.cookies.username != undefined) {
    username = request.cookies.username;  

    database = app.get('database');
    database('posts').select().then(function(retrivePosts){
      retrivePosts.sort(function(a,b){
        if (a.post_number > b.post_number){
          return -1;
        }
        if (a.post_number < b.post_number){
          return 1;
        }else{
          return 0;
        }
      })
      response.render('index', {title: 'DERP', username: username, posts: retrivePosts});
    })
//+++++++++++++++++++++++++++++++++++++++++++++++++

  } else {
    username = null;
    response.render('login', { title: 'DERP', username: username });
  }
});



/*
This is the request handler for receiving a registration request. It will
check to see if the password and confirmation match, and then create a new
user with the given username.

It has some bugs:

* if someone tries to register a username that's already in use, this handler
  will blithely let that happen.
* If someone enters an empty username and/or password, it'll accept them
  without complaint.
*/
router.post('/register', function(request, response) {

  var username = request.body.username,
      password = request.body.password,
      password_confirm = request.body.password_confirm,
      email = request.body.email,
      database = app.get('database');
      

  


  if (password === password_confirm) {


//stash username password for later verification
  var newNonce = uuid.v4()
  usersToAdd.push({nonce: newNonce, username: username, password: password})
  console.log(usersToAdd);
  


  //create transporter object
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'thhan1985',
      pass: 'Parker08'
    }
  })


var verificationUrl = 'http://localhost:3000/verify_email/' + newNonce;
  // setup e-mail data with unicode symbols 
var mailOptions = {
    from: 'Tim ✔ <thhan1985@gmail.com>', // sender address 
    to: email,// list of receivers 
    subject: 'Hello ✔', // Subject line 
    text: 'Hello world ✔', // plaintext body 
    html: '<a href=' + verificationUrl + '>Click link to verify email</a>' // html body 
};

// send mail with defined transport object 
transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + info.response);
    }
});

  response.render('login', {
    title: 'Authorize Me!',
    user:null,
    error: 'Please click link in your email'
  });




  } else {
    response.render('index', {
      title: 'Authorize Me!',
      user: null,
      error: "Password didn't match confirmation"
    });
  }
});




//email verification
router.get('/verify_email/:nonce', function(request, response) {
  database = app.get('database');
  var returnedNonce = request.params.nonce;
//add users to the database
  usersToAdd.forEach(function(user){
  if(user.nonce === returnedNonce){
    database('users').insert({
      username : user.username,
      password : user.password,
      email    : user.email
      }).then(function(){
        response.cookie('username', user.username)
        response.redirect('/')
      })
    }   
  })
});

    // redisClient.get(request.params.nonce, function(userId) {
    //     redisClient.del(request.params.nonce, function() {
    //         if (userId) {
    //             new User({id: userId}).fetch(function(user) {
    //                 user.set('verifiedAt', new Date().toISOString());
    //                 // now log the user in, etc.
    //             })
    //         } else {
    //             response.render('index',
    //                 {error: "That verification code is invalid!"});
    //         }
    //     });
    // });


//


router.post('/login', function(request, response) {
  /*
  Fetch the values the user has sent with their login request. Again, we're
  using request.body because it's a POST handler.

  Again, app.get('database') returns the knex object set up in app.js.
  */

  var username = request.body.username,
      password = request.body.password,
      database = app.get('database');


  /*
  This is where we try to find the user for logging them in. We look them up
  by the supplied username, and when we receive the response we compare it to
  the supplied password.
  */
  database('users').where({'username': username}).then(function(records) {
    /*
    We didn't find anything in the database by that username. Render the index
    page again, with an error message telling the user what's going on.
    */
    if (records.length === 0) {
        response.render('login', {
          title: 'Authorize Me!',
          user: null,
          error: "No such user"
        });
    } else {
      var user = records[0];
      if (user.password === password) {
        /*
        Hey, we found a user and the password matches! We'll give the user a
        cookie indicating they're logged in, and redirect them to the root path,
        where the GET request handler above will look at their cookie and
        acknowledge that they're logged in.
        */
        response.cookie('username', username);
        response.redirect('/');
      } else {
        /*
        There's a user by that name, but the password was wrong. Re-render the
        index page, with an error telling the user what happened.
        */
        response.render('login', {
          title: 'Authorize Me!',
          user: null,
          error: "Password incorrect"
        });
      }
    }
  });
});

router.post('/addpost', function(request, response){

  var user_id = request.cookies.username,
      postText = request.body.postText,
      postTime = new Date(),
      database = app.get('database');

  database('posts').insert({
    body           : postText,
    username       : user_id,
    posted_at      : postTime
  }).then(function(){
    response.redirect('/');
  });
});

router.post('/logout', function(request, response){
  response.clearCookie('username');
  response.redirect('/');
})


module.exports = router;
