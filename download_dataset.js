const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("datasets/blogset_v2.csv.gz");
const url = "https://www.inf.pucrs.br/linatural/blogs/blogset-br.csv.gz";

console.log(`Downloading ${url}...`);

https.get(url, function (response) {
    if (response.statusCode !== 200) {
        console.error(`Failed to download: ${response.statusCode}`);
        return;
    }
    const len = parseInt(response.headers['content-length'], 10);
    let downloaded = 0;

    response.pipe(file);

    response.on('data', (chunk) => {
        downloaded += chunk.length;
        // console.log(`Downloaded ${(downloaded / 1024 / 1024).toFixed(2)} MB`);
    });

    file.on('finish', function () {
        file.close(() => {
            console.log("Download completed successfully.");
        });
    });
}).on('error', function (err) {
    fs.unlink("datasets/blogset_v2.csv.gz");
    console.error(`Error: ${err.message}`);
});
