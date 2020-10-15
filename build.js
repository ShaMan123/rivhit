const os = require('os');
const child_process = require('child_process');
const path = require('path');

const cwd = path.dirname(__dirname);
const processConfig = { stdio: 'inherit', cwd };
const isWindows = os.platform() === 'win32';

const commands = {
    clearFolder: isWindows ? 'rd /s /q lib' : 'rm -rf ./lib',
    tsc: 'tsc',
}

const optionalCommands = {
    lint: 'npm run lint',
    tslint: 'npm run tslint'
}

//const args = require('minimist')(process.argv.slice(2), { boolean: true });

const runCommands = [
    ...Object.keys(commands).map((command) => commands[command]),
    //...Object.keys(optionalCommands).filter((command) => args[command]).map((command) => optionalCommands[command])
];

build();

function build() {
    runCommands.map((command) => {
        try {
            return child_process.execSync(command, processConfig);
        }
        catch (err) {
            //console.log('err...', err);
        }
    });
}

