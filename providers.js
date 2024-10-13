import * as fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'
import { TOTP } from 'totp-generator';
import os from 'os';


const providersFile='/etc/totp_providers.json';
const dbPath = os.type().includes('Windows') ? 'C:\\etc\\totp.db' : '/etc/topt.db';

console.log(os.type());

//Test function
export async function runOnLaunch(){
}

//TODO: how often to open and close db conn
export async function getProviders(){
  console.log('getProviders');
  const data = await readSettings('danny');
  console.log(data);
  const providerStr=fs.readFileSync(providersFile,'utf-8');
  return JSON.parse(providerStr);
}

export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}


async function readSettings(username){
  //const db = await new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  
  let db;
  try{
    db = await open({
      filename: dbPath,
      mode: sqlite3.OPEN_READONLY,
      driver: sqlite3.Database
    });
    const result = await db.get('SELECT settings FROM users WHERE username = ?',[username]);
    console.log(result);
  } catch(e){
    console.log('DB error');
    console.log(e);
    throw e;
  } finally{
    if(db) db.close();
  }

  /*const readData = (username) => {
    const sql = `SELECT * FROM users WHERE username = ?`;
  
    db.get(sql, [username], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row) {
        console.log(row); // row contains the matching row
      } else {
        console.log('No record found');
      }
    });
  };
  
  readData('danny');*/
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