import { getUserSettings, getOtp, deleteProvider, setProvider, readConfig } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours } from './app/util.js';
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import bcrypt from 'bcrypt';

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));

const theUser='danny';

////////////////////////   LOG IN STUFF   ////////////////////////
// Set up session management
app.use(
  expressSession({
    secret: await readConfig('session_key'),
    resave: false,
    saveUninitialized: true,
  })
);

// Simple hardcoded user for authentication example
const USER = { username: 'admin', password: 'whatafundntest' };

app.get('/register', (req, res) => {
  res.render('register', { message: '' });
});

// POST: Handle user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  //TODO: make not a in-memory store
  if (users[username]) {
    return res.render('register', { message: 'User already exists!' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    users[username] = hashedPassword; // Store hashed password
    res.redirect('/login');
  } catch (error) {
    res.render('register', { message: 'Error registering user!' });
  }
});


// Login middleware
app.use((req, res, next) => {
  if (req.path === '/login' && req.session.user) {
    console.log('user defined');
    res.redirect('/');
    return;
  }
  else if(req.path !== '/login' && !req.session.user && !req.path.endsWith('.ico')){
    console.log('redirecting to login')
    res.redirect('/login');
    return;
  }
  next();
});



// GET route for the login page
app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});

// POST route to handle login logic
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === USER.username && password === USER.password) {
    req.session.user = username; // Save user to session
    return res.redirect('/'); // Redirect on success
  } else {
    res.render('login', { message: 'Invalid username or password' });
  }
});

// Route to log out
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {5
    if (err) return res.redirect('/dashboard');
    res.redirect('/login');
  });
});


////////////////////////   INDEX   ////////////////////////
app.get('/',async (req,res)=>{
  console.log('loading index');
  const p = await getUserSettings(theUser);
  console.log(JSON.stringify(p));
  res.render('index',{providerNames: p.providerNames});
});


////////////////////////   CREATE   ////////////////////////
app.get('/create', async (req,res)=>{
  res.render('create');
});

app.post('/create', (req, res) => {
  const { name, code } = req.body;
  setProvider(theUser,{name, code});
  res.redirect('/');
});


////////////////////////   VIEW   ////////////////////////
app.get('/p/:providerName', async (req, res) => {
  const p = await getUserSettings(theUser, req.params.providerName);

  if(!p.thisProvider){
    res.send(`Valid provider names: ${p.providerNames.join(', ')}`);
    return;
  }

  const provider = p.thisProvider;

  if(!(await isAccessible())){
    console.log('is not accessible');
    res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
    return;
  }

  provider.otp = getOtp(provider);
  provider.secsRemaining = secsRemaining();

  res.render('provider',{provider});
});


////////////////////////   DELETE   ////////////////////////
app.get('/p/:providerName/delete', async (req, res) => {
  const p = await getUserSettings(theUser, req.params.providerName);
  res.render('delete',{provider: p.thisProvider});
});

app.post('/p/:providerName/delete', async (req, res) => {
  if(req.body.action === 'delete'){
    await deleteProvider(theUser, req.params.providerName);
    res.redirect('/');
    return;
  }
  res.redirect(`/p/${req.params.providerName}`);
});


////////////////////////   LISTEN   ////////////////////////
const port = 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});