import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let targetDir = os.type().includes('Windows') ? 'C:\\usr\\lib\\totp' : '/usr/lib/topt/';

const excludedDirs=['node_modules', 'secrets','.git'];
const excludedFiles=['.gitignore','README.md'];

async function setup(){
    const cwd=process.cwd();
    if(!cwd.endsWith('totp')){
        console.error(`Must run from totp directory. Current dir: ${cwd}`);
        return;
    }
    
    await fs.promises.rm(targetDir, { recursive: true, force: true });

    const dirContents = await fs.promises.readdir(cwd, { withFileTypes: true });
    for (let entry of dirContents) {
        const srcPath = path.join(cwd, entry.name);
        const destPath = path.join(targetDir, entry.name);

        if (entry.isDirectory() && excludedDirs.includes(entry.name)) {
            console.log(`skipping ${entry.name}`);
            continue;
        } else if(excludedFiles.includes(entry.name)){
                console.log(`skipping ${entry.name}`);
                continue;
        }

        console.log(`copying ${srcPath} to ${destPath}`);
        await fs.promises.cp(srcPath, destPath, {recursive: true});
    }
    
}

try{
    setup();
} catch(e){
    throw e;
}