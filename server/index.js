// config should be imported before importing any other file
const config = require('./config/config');
const app = require('./config/express');
const router = require('./routes/index.route')
const fs = require('fs-extra');
require('./config/mongoose');

fs.ensureDirSync(__dirname + "/../userDirectory");
fs.createFile(__dirname + "/../logs/logs.txt", function(err) {
})

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  app.listen(config.port, () => {    
    console.info(`server started on port ${config.port} (${config.env})`);
    fs.appendFile(__dirname + "/../logs/logs.txt",new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') +` : server started on port ${config.port} (${config.env})`, function(err) {
    })
  });
}

module.exports = app;