import * as fs from 'fs';
import { TOTP } from 'totp-generator';

const providersFile='/etc/totp_providers.json';


export async function getProviders(){
  const providerStr=fs.readFileSync(providersFile,'utf-8');
  return JSON.parse(providerStr);
}

export function getOtp(provider){
    const { otp } = TOTP.generate(provider.code.replaceAll(" ", ""));
    return otp;
}
