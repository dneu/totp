import sqlite3 from 'sqlite3';
import { TOTP } from 'totp-generator';
import {openDb} from './db.js';

const theUser='danny'; //only one user for now

export async function getProviders(name){
  const providers = await readSettings();
  const thisProvider = providers.find(p=>p.name.toLowerCase() === name);
  const providerNames = providers.map(p=>p.name);
  return {
    providers,
    providerNames,
    thisProvider
  }; 
}

export async function setProvider(provider){
  let db;
  try{
    const settings = await readSettings();
    settings.push(provider);
    const newJson = JSON.stringify(settings);
    db = await openDb('rw');
    const result = await db.run('update users set settings = ? where username = ?',newJson,theUser);
  } finally{
    if(db) db.close();
  }
}


export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}

async function readSettings(){
  let db;
  try{
    db = await openDb('r');
    const result = await db.get('SELECT settings FROM users WHERE username = ?',[theUser]);
    return JSON.parse(result.settings);
  } finally{
    if(db) db.close();
  }
}

//TODO: make this time sensitive to make sure it's not being done repeatedly
export async function deleteProvider(providers, provider){
  let db;
  try{
    const settings = await readSettings();
    console.log('pre delete: ');
    console.log(settings);
    const newSettings = providers.filter(p=> p.name!==provider.name);
    console.log('post delete: ');
    console.log(newSettings);
    const newJson = JSON.stringify(newSettings);
    const db = await openDb('rw');
    const result = await db.run('update users set settings = ? where username = ?',newJson,theUser);
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