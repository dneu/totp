import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch, deleteProvider } from './app/providers.js';
import { secsRemaining, isAccessible } from './app/util.js';
import * as pug from 'pug';

const hostname = '127.0.0.1';
const port = 8080;

runOnLaunch();

const getIndex = pug.compileFile('templates/index.pug');
const getProvider = pug.compileFile('templates/provider.pug');
const getDelete = pug.compileFile('templates/delete.pug');

const server = createServer(async (req, res) => {
  try{
    console.log('raw url: ' + req.url);
    const url = req.url.split('/').filter(i => i);
    console.log('url: ' + JSON.stringify(url));

    const providers = await getProviders();
    const providerNames = Object.keys(providers);

    // Check for incorrect path
    if(url.length > 0 && url[0] !=='p'){
      res.writeHead(404);
      res.end();
      return;
    }


    if(url.length === 0){
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getIndex({providerNames}));
      return;
    }

    
    const pParam = url[1]?.toLowerCase();
    const prvName = providerNames.find(name=>name.toLowerCase() === pParam);
    if(!prvName){
      res.end(`Valid provider names: ${providerNames.join(', ')}`);
      return;
    }
    const provider = providers[prvName];
    provider.name = prvName;

    // CONFIRM DELETE
    if(url.length === 3 && url[2].toLowerCase() === 'confirmdelete'){
      deleteProvider(providers, provider);
      res.writeHead(302, { 'Location': '/' });
      res.end();
      return;
    }

    // Everything past this point is a valid URL that does not redirect
    res.writeHead(200, { 'Content-Type': 'text/html' });

    // DELETE PAGE
    if(url.length === 3 && url[2].toLowerCase() === 'delete'){
      res.end(getDelete({provider}));
      return;
    }


    if(!isAccessible()){
      res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
      return;
    }

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

