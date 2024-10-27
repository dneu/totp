import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch, deleteProvider } from './app/providers.js';
import { secsRemaining, isAccessible, accessibleHours } from './app/util.js';
import * as pug from 'pug';
import express from 'express';

const hostname = '127.0.0.1';
const port = 8080;

runOnLaunch();

const getIndex = pug.compileFile('templates/index.pug');
const getProvider = pug.compileFile('templates/provider.pug');
const getDelete = pug.compileFile('templates/delete.pug');
const getCreate = pug.compileFile('templates/create.pug');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/',async (req,res)=>{
  const p = await getProviders();
  res.send(getIndex({providerNames: p.providerNames}));
});

app.get('/create', async (req,res)=>{
  res.send(getCreate());
});

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


app.listen(port, () => {
  console.log(`Listen on port ${port}`)
});