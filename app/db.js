import * as path from 'path';
import { open } from 'sqlite'
import sqlite3 from 'sqlite3';

const appDataDir =process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
const dbPath = path.join(appDataDir,'/totp/totp.db');

export async function openDb(mode = 'r'|'rw'){
  let enumMode = mode === 'rw' ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READWRITE;
  return await open({
    filename: dbPath,
    mode: enumMode,
    driver: sqlite3.Database
  });
}