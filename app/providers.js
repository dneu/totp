import * as fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { TOTP } from 'totp-generator';
import os from 'os';
import * as path from 'path';

const theUser='danny'; //only one user for now
const appDataDir =process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const dbPath = path.join(appDataDir,'/totp/totp.db');

//Test function
export async function runOnLaunch(){
}

export async function getProviders(name){
  const providers = await readSettings();

  const providerNames = Object.keys(providers); 
  for(const providerName of providerNames){
    providers[providerName].name = providerName;
  }
  const foundName = providerNames.find(pname=>pname.toLowerCase() === name);
  const thisProvider = providers[foundName];
  
  return {
    providers,
    providerNames,
    thisProvider
  }; 
}

export async function setProvider(name,code){
  
}

export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}

async function readSettings(){
  let db;
  try{
    db = await open({
      filename: dbPath,
      mode: sqlite3.OPEN_READONLY,
      driver: sqlite3.Database
    });
    const result = await db.get('SELECT settings FROM users WHERE username = ?',[theUser]);
    return JSON.parse(result.settings);
  } catch(e){
    console.log(`DB error (${dbPath})`);
    console.log(e);
    throw e;
  } finally{
    if(db) db.close();
  }
}

//TODO: make this time sensitive to make sure it's not being done repeatedly
export async function deleteProvider(providers, provider){
  let db;
  try{
    const settings = await readSettings();
    delete settings[provider.name];
    const newJson = JSON.stringify(settings);
    const db = await open({
      filename: dbPath,
      mode: sqlite3.OPEN_READWRITE,
      driver: sqlite3.Database
    });
    const result = await db.run('update users set settings = ? where username = ?',newJson,theUser);
  } catch(e){
    console.log(`DB error (${dbPath})`);
    console.log(e);
    throw e;
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