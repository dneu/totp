import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch } from './app/providers.js';
import { secsRemaining, isAccessible } from './app/util.js';
import * as pug from 'pug';

const hostname = '127.0.0.1';
const port = 8080;

runOnLaunch();

const getIndex = pug.compileFile('templates/index.pug');
const getProvider = pug.compileFile('templates/provider.pug');

const server = createServer(async (req, res) => {
  try{
    res.writeHead(200, { 'Content-Type': 'text/html' });
    console.log('raw url: ' + req.url);
    const url = req.url.split('/').filter(i => i);
    console.log('url: ' + JSON.stringify(url));

    if(url.length === 0){
      console.log('root');
      const providers = await getProviders();
      const providerNames = Object.keys(providers);
      res.end(getIndex({providerNames}));
      return;
    }

    if(!url[0] ==='p'){
      res.end();
      return;
    }

    const providers = await getProviders();
    const providerNames = Object.keys(providers);
    const pParam = url[1]?.toLowerCase();
    const prvName = providerNames.find(name=>name.toLowerCase() === pParam)

    if(!prvName){
      res.end(`Valid provider names: ${providerNames.join(', ')}`);
      return;
    }

    if(!isAccessible()){
      res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
      return;
    }

    const provider = providers[prvName];
    provider.name = prvName;
    provider.otp = getOtp(provider);
    provider.secsRemaining = secsRemaining();
    console.log(JSON.stringify(provider,null,2));

    res.end(getProvider({provider}));
  } catch(e){
    console.error(e.toString());
    console.error(e.stack);
    res.end(e.toString());
  }
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

