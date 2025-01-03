import { getUserSettings, getOtp, deleteProvider, setProvider, readConfig, createUser, isValidCode } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours, lockoutExplain } from './app/util.js';
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

  if (authcode !== (await readConfig('auth_code'))) {
    return res.render('register', { message: 'Wrong auth code!' });
  }

  if(username.length > 30 || password.length>120){
    return res.render('register', { message: 'Invalid input' });
  }

  const foundUser = await getUserSettings(username);  
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
  const isFile = req.path.endsWith('.ico') || req.path.endsWith('.css');
  if(isFile){
    next();
    return;
  }

  if (req.path === '/login' && req.session.user) {
    res.redirect('/');
    return;
  }
  else if(req.path !== '/login' && !req.session.user){
    res.redirect('/login');
    return;
  }
  else if(req.path === '/lockout' && isAccessible()){
    res.redirect('/');
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

app.get('/lockout',async (req,res)=>{

  res.render('lockout',{explain: lockoutExplain()});
});



////////////////////////   CREATE   ////////////////////////
app.get('/create', async (req,res)=>{
  res.render('create');
});

app.post('/create', async (req, res) => {
  const { name, code } = req.body;
  if(name.length > 80 || code.length > 80){
    res.render('create', { message: 'Too long!' });
    return;
  }
  if(!isValidCode(code)){
    res.render('create', { message: 'Invalid OTP code!' });
    return;
  }
  
  const userSettings = await getUserSettings(req.session.user, req.params.providerName);
  const maxProviders=20;

  if(userSettings.providers.find(p=>p.name === name)){
    res.render('create', { message: `Error: ${name} already exists!` });
    return;

  }

  if(userSettings.providers.length>=maxProviders){
    res.render('create', { message: `Error: can't create more than ${maxProviders} providers` });
    return;
  }
  const provider = {name, code};
  setProvider(userSettings, req.session.user, provider);
  
  req.session.currentProviderCode = code;
  provider.otp = getOtp(code);
  console.log('message');
  const message = `IMPORTANT: test this code before leaving this page, because this is the last time you'll be able to view it before getting locked out.`;
  res.render('provider',{provider, message});
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
    res.redirect('/lockout');
    return;
  }

  req.session.currentProviderCode = provider.code;
  provider.otp = getOtp(provider.code);
  res.render('provider',{provider});
});

app.get('/code',(req,res)=>{
  // Must set this when getting /p/providernames
  if(!req.session.currentProviderCode){
    res.send(`Error: no current provider code set`);
    return;
  }
  res.send(getOtp(req.session.currentProviderCode));
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