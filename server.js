import { createServer } from 'node:http';
import { getProviders } from './providers.js';
import { secsRemaining, isAccessible } from './util.js';

const hostname = '127.0.0.1';
const port = 8080;

const server = createServer(async (req, res) => {
  try{
    const providers = getProviders();
    console.log('providers');
    console.log(providers);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    const url = req.url;

    if(url==='/'){
      let body = '';
      for(const provider of Object.keys(providers)){
        body += `<a href=${provider}>${provider}</a>\n`;
      }
      res.end(body);
      return;
    }

    const sUrl = url.slice(1).toLowerCase();
    let prvName;
    for(const prv of Object.keys(providers)){
      if(prv.toLowerCase() === sUrl.toLowerCase()){
        prvName = prv;
        break;
      }
    }

    if(!prvName){
      res.end(`Valid provider names: ${Object.keys(providers)}`);
      return;
    }

    if(!isAccessible()){
      res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
      return;
    }

    const provider = providers[prvName];
    const otp = getOtp(provider);

    res.end(`<h1>${prvName}</h1>
      <h3>${otp}</h3>
      <p>${secsRemaining} seconds remaining</p>
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

