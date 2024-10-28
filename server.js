import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch, deleteProvider, setProvider } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours } from './app/util.js';
import * as pug from 'pug';
import express from 'express';
import bodyParser from 'body-parser';
import expressSession from 'express-session';

const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

/*const getIndex = pug.compileFile('templates/index.pug');
const getProvider = pug.compileFile('templates/provider.pug');
const getDelete = pug.compileFile('templates/delete.pug');
const getCreate = pug.compileFile('templates/create.pug');*/

app.use(bodyParser.urlencoded({ extended: true }));


////////////////////////   INDEX   ////////////////////////
app.get('/',async (req,res)=>{
  console.log('loading index');
  const p = await getProviders();
  console.log(JSON.stringify(p));
  res.render('index',{providerNames: p.providerNames});
});


////////////////////////   CREATE   ////////////////////////
app.get('/create', async (req,res)=>{
  res.render('create');
});

app.post('/create', (req, res) => {
  const { name, code } = req.body;
  setProvider({name, code});
  res.redirect('/');
});


////////////////////////   VIEW   ////////////////////////
app.get('/p/:providerName', async (req, res) => {
  const p = await getProviders(req.params.providerName);

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
  const p = await getProviders(req.params.providerName);
  res.render('delete',{provider: p.thisProvider});
});

app.post('/p/:providerName/delete', async (req, res) => {
  const p = await getProviders(req.params.providerName);
  if(req.body.action === 'delete'){
    await deleteProvider(p.providers, p.thisProvider);
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