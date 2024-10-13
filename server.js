import { createServer } from 'node:http';
import { getProviders, getOtp, runOnLaunch } from './providers.js';
import { secsRemaining, isAccessible } from './util.js';

const hostname = '127.0.0.1';
const port = 8080;

runOnLaunch();

const server = createServer(async (req, res) => {
  try{
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const url = req.url;

    console.log('url: ' + url);

    if(url==='/'){
      const providers = await getProviders();
      let body = '';
      for(const provider of Object.keys(providers)){
        body += `<a href=/p/${provider.toLowerCase()}>${provider}</a>\n`;
      }
      res.end(body);
      return;
    }

    if(!url.startsWith('/p/')){
      res.end();
      return;
    }

    const providers = await getProviders();
    const sUrl = url.replace('/p/','').toLowerCase();
    let prvName;
    for(const prv of Object.keys(providers)){
      if(prv.toLowerCase() === sUrl.toLowerCase()){
        prvName = prv;
        break;
      }
    }

    if(!prvName){
      res.end(`Valid provider names: ${Object.keys(providers).join(', ')}`);
      return;
    }

    if(!isAccessible()){
      res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
      return;
    }

    const provider = providers[prvName];
    res.end(`<h1>${prvName}</h1>
      <h3>${getOtp(provider)}</h3>
      <p>${secsRemaining()} seconds remaining</p>
    `);
  } catch(e){
    console.error(e.toString());
    console.error(e.stack);
    res.end(e.toString());
  }
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

