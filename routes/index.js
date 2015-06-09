var express = require('express');
var router = express.Router();
var app = require('../app');
// var moment = require('moment');
var redis = require('redis');
var cache = redis.createClient();



router.get('/', function(request, response, next){
  var username = null
  database = app.get('database');

  if (request.cookies.username != undefined){
    username = request.cookies.username;
  }
})

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
  /*
  request.body is an object containing the data submitted from the form.
  Since we're in a POST handler, we use request.body. A GET handler would use
  request.params. The parameter names correspond to the "name" attributes of
  the form fields.

  app.get('database') returns the knex object that was set up in app.js. app.get
  is not the same as router.get; it's more like object attributes. You could
  think of it like it's saying app.database, but express apps use .get and .set
  instead of attributes to avoid conflicts with the attributes that express apps
  already have.
  */
  var username = request.body.username,
      password = request.body.password,
      password_confirm = request.body.password_confirm,
      database = app.get('database');

  if (password === password_confirm) {


//set verification email+++++++++++++++++++++++++++++++
    database('users').insert({
      username: username,
      password: password,
    }).then(function() {
      /*
      Here we set a "username" cookie on the response. This is the cookie
      that the GET handler above will look at to determine if the user is
      logged in.

      Then we redirect the user to the root path, which will cause their
      browser to send another request that hits that GET handler.
      */
      response.cookie('username', username)
      response.redirect('/');
    });
  } else {
    /*
    The user mistyped either their password or the confirmation, or both.
    Render the index page again, with an error message telling them what's
    wrong.
    */
    response.render('index', {
      title: 'Authorize Me!',
      user: null,
      error: "Password didn't match confirmation"
    });
  }
});

/*
This is the request handler for logging in as an existing user. It will check
to see if there is a user by the given name, then check to see if the given
password matches theirs.

Given the bug in registration where multiple people can register the same
username, this ought to be able to handle the case where it looks for a user
by name and gets back multiple matches. It doesn't, though; it just looks at
the first user it finds.
*/
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
