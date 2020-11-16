'use strict';

const fs = require('fs');

global.writeFile = (path, contents) => fs.writeFileSync(path, contents);

global.readFile = (path) => fs.readFileSync(path, 'utf8');
require('./phone-controller-client');
