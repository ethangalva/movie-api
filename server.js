const http = require('http'), url = require('url'), fs = require('fs');

http.createServer((request, response) => {
    let addr = request.url,
    q = url.parse(addr, true),
    filePath = '';

    if (q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else {
        filePath = 'index.html';
    }

    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added to log.')
        }
    });
})


console.log(q);