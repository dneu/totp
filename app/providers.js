import sqlite3 from 'sqlite3';
import { TOTP } from 'totp-generator';
import {openDb} from './db.js';

//TODO: rename
export async function getUserSettings(username, providerName){
  const providers = await _getRawUserData(username);
  const thisProvider = providers.find(p=>p.name.toLowerCase() === providerName);
  const providerNames = providers.map(p=>p.name);
  return {
    providers,
    providerNames,
    thisProvider
  }; 
}

export async function setProvider(username, provider){
  let db;
  try{
    const userSettings = await getUserSettings(username);
    console.log('userSettings: ' + JSON.stringify(userSettings));
    const settings = userSettings.providers;
    console.log('settings: ' + JSON.stringify(settings));
    settings.push(provider);
    const newJson = JSON.stringify(settings);
    db = await openDb('rw');
    const result = await db.run('update users set settings = ? where username = ?',newJson,username);
  } finally{
    if(db) db.close();
  }
}


export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}

async function _getRawUserData(username){
  let db;
  try{
    db = await openDb('r');
    const result = await db.get('SELECT * FROM users WHERE username = ?',[username]);
    return JSON.parse(result.settings);
  } finally{
    if(db) db.close();
  }
}

//TODO: make this time sensitive to make sure it's not being done repeatedly
export async function deleteProvider(username, providerName){
  let db;
  try{
    const providers = (await getUserSettings(username)).providers;
    console.log('pre delete: ');
    console.log(providers);
    const newProviders = providers.filter(p=> p.name!==providerName);
    console.log('post delete: ');
    console.log(newProviders);
    const newJson = JSON.stringify(newProviders);
    const db = await openDb('rw');
    const result = await db.run('update users set settings = ? where username = ?',newJson,username);
  } finally{
    if(db) db.close();
  }
}

export async function readConfig(key){
  let db;
  try{
    db = await openDb('r');
    const result = await db.get('SELECT value FROM config WHERE key = ?',[key]);
    return result.value;
  } finally{
    if(db) db.close();
  }
}


async function insertDataTest(){
  const db = await new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
  const insertData = (username, settings) => {
    const sql = `INSERT INTO users (username, settings) VALUES (?, ?)`;
  
    db.run(sql, [username, settings], function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
  }; 

  db.close();
}