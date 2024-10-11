const { createServer } = require('node:http');
const fs = require('fs');
const TOTP = require('totp-generator').TOTP;

const hostname = '127.0.0.1';
const port = 8080;

const providersFile='/usr/lib/topt/providers.json';

const accessibleHours = [8, 12, 18, 21];

// Read providers
let providers;
let providerNames = [];
async function readProviders(){
  providerNames = [];
  // read providers
  const providerStr=fs.readFileSync(providersFile,'utf-8');
  providers = JSON.parse(providerStr);
}

const server = createServer(async (req, res) => {
  try{
    await readProviders();
    
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
      res.end(`provider names: ${Object.keys(providers)}`);
      return;
    }

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    //TODO: remove
    const accessible=true;  
    //const accessible = accessibleHours.includes(hour) && minute < 15; 
    if(!accessible){
      res.end(`Code is only accessible within 15 minutes of these hours: ${accessibleHours.join(', ')}`);
      return;
    }

    const provider = providers[prvName];
    const { otp } = TOTP.generate(provider.code);
    const secsRemaining = 30-now.getSeconds()%30;

    res.end(`<h1>${prvName}</h1>
      <h3>${otp}</h3>
      <p>${secsRemaining} seconds remaining</p>
    `);
  } catch(e){
    res.end(JSON.stringify(e));
  }
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

