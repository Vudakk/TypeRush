const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');

const fileStream = fs.createReadStream('datasets/blogset-br.csv.gz');
const unzip = zlib.createGunzip();
const rl = readline.createInterface({
    input: fileStream.pipe(unzip),
    crlfDelay: Infinity
});

let lines = 0;
rl.on('line', (line) => {
    console.log(line);
    lines++;
    if (lines >= 5) { // Read first 5 lines
        rl.close();
        fileStream.destroy();
    }
});
