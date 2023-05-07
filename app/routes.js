module.exports = function (app, passport, db) {
  const savedNotes = db.collection('notes')

  var multer = require('multer')
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  var upload = multer({ storage: storage })
  let arr = []


  const { Configuration, OpenAIApi } = require("openai");

  const configuration = new Configuration({
    apiKey: 'placeholder'
  });
  const openai = new OpenAIApi(configuration);






  // normal routes ===============================================================



  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, async (req, res) => {
    if (req.query.showlast) {
      // savedNotes.find({ userId: req.user._id }).toArray((err, result) => {
      savedNotes.find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('profile.ejs', {
          last: result[result.length - 1],
          notes: result
        })
      })
    } else {
      savedNotes.find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('profile.ejs', {
          last: '',
          notes: result
        })
      })
    };
  })
  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!')
    });
    res.redirect('/');
  });

  // message board routes ===============================================================




  app.post('/chat', async (req, res) => {

    let question = req.body.question
    console.log(question)

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Summarize this for a second-grade student: ${question}`,
      temperature: 0.7,
      max_tokens: 64,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    })
    const parsableJSONresponse = response.data.choices[0].text.replace();
    const parsedResponse = JSON.stringify(parsableJSONresponse);
    // Use regular expression to match escaped new line characters
    let regex = /[\\n\"]/g;
    let regex2 = /^\./g
    // Replace all matches with an empty string
    let formattedResponse = parsedResponse.replace(regex, "")
    formattedResponse = formattedResponse.replace(regex2, "")

    console.log(parsableJSONresponse)
    savedNotes.insertOne({ original: question, simplified: formattedResponse, saved: false, userId: req.user._id }, (err, result) => {
      console.log(result)
      if (err) return res.send(err)
      res.redirect('/profile?showlast=true')
    })


    // res.send(parsedResponse)
    // // res.redirect('/profile')
  })


  app.put('/saved', (req, res) => {
    savedNotes
      .findOneAndUpdate({ simplified: req.body.simplified, user: req.user._id }, {
        $set: {
          saved: req.body.saved
        }
      }, {
        sort: { _id: -1 },
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })



  app.delete('/delete', (req, res) => {
    savedNotes.findOneAndDelete({ simplified: req.body.simplified }, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })


  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}

