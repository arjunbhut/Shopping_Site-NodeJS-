const path = require('path');
const mul = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');


const errorController = require('./controllers/error');
const User = require('./models/user');

const csrtProtection = csrf();

const MONGODB_URI =
'mongodb+srv://Arjun:arjun31@cluster0-ptp5p.mongodb.net/shop?retryWrites=true&w=majority';



const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const fileFilter = (req,file,cb) =>{

  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype=='image/jpeg')
  {
    cb(null,true);
  }
 
  cb(null,false);
  

}

const fileStorage = multer.diskStorage({

  destination: (req, file, cb) => {
    
    cb(null,'images');

  } ,

  filename: (req, file, cb) =>{

    cb(null, new Date().toISOString() + '-' + file.originalname);

  }

});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(mul({storage:fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
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
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req,res,next) =>{
  if(!req.session.user) {
    return next();
  }
  User.findById(req.session.user)
      .then(user =>{

        if(!user)
        {
          return next();
        }

        req.user = user;
        next();
      })
      .catch(err => console.log(err));
});




app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use((error,req,res,next) =>{
  res.render('500',{
    pageTitle: 'Error Occured',
    path: '/50'
  })
})



mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log('CONNECTED');
    app.listen(3000);
    })
  .catch(err => {
    console.log(err);
  });
