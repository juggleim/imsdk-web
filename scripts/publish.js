let fs = require('fs');
let path = require('path');
let { exec, execSync } = require('child_process');
let { version } = require('../package.json');

let releasePKG = require('../../jugglechat-websdk-release/package.json');

// 移动 SDK
let url = `dist/juggleim-es-${version}-beta.js`;
let cmd = `cp ${url} ../jugglechat-websdk-release/index.js`;
execSync(cmd);

//更新版本号
releasePKG.version = version;
fs.writeFileSync('../jugglechat-websdk-release/package.json', JSON.stringify(releasePKG));