import sqlite3 from 'sqlite3';
import { TOTP } from 'totp-generator';
import {openDb} from './db.js';

//TODO: rename
export async function getUserSettings(username, providerName){
  const userData = await _getRawUserData(username);
  if(!userData){
    return undefined;
  }
  
  const providers = JSON.parse(userData.settings);
  console.log('Querying providers');
  const thisProvider = providers.find(p=>p.name.toLowerCase() === providerName);
  const providerNames = providers.map(p=>p.name);
  return {
    username: userData.username,
    pass: userData.pass,
    providers,
    providerNames,
    thisProvider
  }; 
}

export async function setProvider(username, provider){
  let db;
  try{
    const userSettings = await getUserSettings(username);
    const settings = userSettings.providers;
    settings.push(provider);
    const newJson = JSON.stringify(settings);
    db = await openDb('rw');
    const result = await db.run('update users set settings = ? where username = ?',newJson,username);
    return settings;
  } finally{
    if(db) db.close();
  }
}


export function getOtp(provider){
    try{
      const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
      return otp;
    } catch(e){
      return "Error!";
    }
}

export function isValidCode(code){
  try{
    const { otp } = TOTP.generate(code.replaceAll(" ", ""));
    return true;
  } catch(e){
    return false;
  }

}

async function _getRawUserData(username){
  let db;
  try{
    db = await openDb('r');
    return await db.get('SELECT * FROM users WHERE username = ?',[username]);
  } finally{
    if(db) db.close();
  }
}

//TODO: make this time sensitive to make sure it's not being done repeatedly
export async function deleteProvider(username, providerName){
  let db;
  try{
    const providers = (await getUserSettings(username)).providers;
    const newProviders = providers.filter(p=> p.name!==providerName);
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

export async function createUser(username,hashedPass){
  let db;
  try{
    db = await openDb('rw');
    await db.run(`INSERT INTO users (username, pass, settings) VALUES (?, ?, ?)`,[username, hashedPass,'[]']);
  } finally{
    if(db) db.close();
  }
}