const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const errorController = require('./controllers/error');
const User = require('./models/user');

const csrtProtection = csrf();

const MONGODB_URI =
'mongodb+srv://Arjun:********@cluster0-ptp5p.mongodb.net/shop?retryWrites=true&w=majority';



const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);


app.use(csrtProtection);
app.use(flash());

app.use((req,res,next) =>{
  if(!req.session.user) {
    return next();
  }
  User.findById(req.session.user)
      .then(user =>{
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
});

app.use((req,res,next) =>{
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log('CONNECTED');
    app.listen(3000);
    })
  .catch(err => {
    console.log(err);
  });
