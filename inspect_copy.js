const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');

// Read from the COPY
const fileStream = fs.createReadStream('datasets/temp_blogset.csv.gz');
const unzip = zlib.createGunzip();
const rl = readline.createInterface({
    input: fileStream.pipe(unzip),
    crlfDelay: Infinity
});

let lines = 0;
rl.on('line', (line) => {
    console.log(line);
    lines++;
    if (lines >= 5) {
        rl.close();
        fileStream.destroy();
    }
});
