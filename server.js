import { getUserSettings, getOtp, deleteProvider, setProvider, readConfig, createUser } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours } from './app/util.js';
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import bcrypt from 'bcrypt';

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: true }));

////////////////////////   LOG IN STUFF   ////////////////////////
// Set up session management
app.use(
  expressSession({
    secret: await readConfig('session_key'),
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/register', (req, res) => {
  res.render('register', { message: '' });
});

app.post('/register', async (req, res) => {
  const { username, password, authcode } = req.body;

  const foundUser = await getUserSettings(username);
  
  if (authcode !== (await readConfig('auth_code'))) {
    console.log('wrong auth code');
    return res.render('register', { message: 'Wrong auth code!' });
  }

  if (!!foundUser) {
    console.log(`User ${username} already exists`);
    return res.render('register', { message: 'User already exists!' });
  }

  try {
    const hashedPass = await bcrypt.hash(password, 10);
    await createUser(username, hashedPass)  
    res.redirect('/login');
  } catch (error) {
    res.render('register', { message: 'Error registering user!' });
  }
});


// Login middleware
app.use((req, res, next) => {
  if (req.path === '/login' && req.session.user) {
    res.redirect('/');
    return;
  }
  else if(req.path !== '/login' && !req.session.user && !req.path.endsWith('.ico') && !req.path.endsWith('.css')){
    console.log('redirecting to login')
    res.redirect('/login');
    return;
  }
  next();
});

// Serve static content
app.use(express.static('static'));


// GET route for the login page
app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});

// POST route to handle login logic
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const userSettings = await getUserSettings(username);
  const passwordMatch = await bcrypt.compare(password,userSettings?.pass);
  if (username === userSettings?.username && passwordMatch) {
    req.session.user = username;
    return res.redirect('/');
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
  const providers = await getUserSettings(req.session.user);
  res.render('index',{providerNames: providers.providerNames});
});


////////////////////////   CREATE   ////////////////////////
app.get('/create', async (req,res)=>{
  res.render('create');
});

app.post('/create', (req, res) => {
  const { name, code } = req.body;
  setProvider(req.session.user, {name, code});
  res.redirect('/');
});


////////////////////////   VIEW   ////////////////////////
app.get('/p/:providerName', async (req, res) => {
  const p = await getUserSettings(req.session.user, req.params.providerName);

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
  const p = await getUserSettings(req.session.user, req.params.providerName);
  res.render('delete',{provider: p.thisProvider});
});

app.post('/p/:providerName/delete', async (req, res) => {
  if(req.body.action === 'delete'){
    await deleteProvider(req.session.user, req.params.providerName);
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