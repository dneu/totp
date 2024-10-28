import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch, deleteProvider, setProvider } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours } from './app/util.js';
import * as pug from 'pug';
import express from 'express';

console.log('starting...');
const port = 8080;

runOnLaunch();

const getIndex = pug.compileFile('templates/index.pug');
const getProvider = pug.compileFile('templates/provider.pug');
const getDelete = pug.compileFile('templates/delete.pug');
const getCreate = pug.compileFile('templates/create.pug');

const app = express();
app.use(express.urlencoded({ extended: true }));


////////////////////////   INDEX   ////////////////////////
app.get('/',async (req,res)=>{
  console.log('loading index');
  const p = await getProviders();
  console.log(JSON.stringify(p));
  res.send(getIndex({providerNames: p.providerNames}));
});


////////////////////////   CREATE   ////////////////////////
app.get('/create', async (req,res)=>{
  res.send(getCreate());
});

app.post('/create', (req, res) => {
  const { name, code } = req.body;
  console.log(`Provider Name: ${name}, Provider Code: ${code}`);
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

  res.send(getProvider({provider}));
});


////////////////////////   DELETE   ////////////////////////
app.get('/p/:providerName/delete', async (req, res) => {
  const p = await getProviders(req.params.providerName);
  res.end(getDelete({provider: p.thisProvider}));
});

app.post('/p/:providerName/delete', async (req, res) => {
  const p = await getProviders(req.params.providerName);
  if(req.body.action === 'delete'){
    deleteProvider(p.providers, p.thisProvider);
    res.redirect('/');
    return;
  }
  res.redirect(`/p/${req.params.providerName}`);
});


////////////////////////   LISTEN   ////////////////////////
app.listen(port, () => {
  console.log(`Listening on port ${port}`)
});