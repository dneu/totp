import * as fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { TOTP } from 'totp-generator';
import os from 'os';
import * as path from 'path';

const providersFile='/etc/totp_providers.json';
const appDataDir =process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const dbPath = path.join(appDataDir,'/totp/totp.db');

//Test function
export async function runOnLaunch(){
}

//TODO: how often to open and close db conn
export async function getProviders(){
  const data = await readSettings('danny');
  console.log(data);
  return data;
}

export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}

async function readSettings(username){
  let db;
  try{
    db = await open({
      filename: dbPath,
      mode: sqlite3.OPEN_READONLY,
      driver: sqlite3.Database
    });
    const result = await db.get('SELECT settings FROM users WHERE username = ?',[username]);
    return JSON.parse(result.settings);
  } catch(e){
    console.log('db path: '+dbPath);
    console.log('DB error');
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