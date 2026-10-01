import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const compiled=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','lib/studoy/time.ts','lib/studoy/types.ts','lib/studoy/statistics.ts','--outDir','.test-build','--module','commonjs','--target','es2020','--skipLibCheck'],{stdio:'inherit'});if(compiled.status)process.exit(compiled.status);
mkdirSync('.test-build',{recursive:true});writeFileSync('.test-build/package.json','{"type":"commonjs"}');
for(const TZ of ['UTC','Asia/Seoul','America/New_York']){const result=spawnSync(process.execPath,['--test','tests/time.test.mjs','tests/statistics.test.mjs'],{stdio:'inherit',env:{...process.env,TZ}});if(result.status)process.exit(result.status);}
