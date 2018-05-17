var mongoose = require('mongoose');
require('dotenv').config();
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://' + process.env.MONGOUSER + ':' + process.env.MONGOPASSWD + '@' + process.env.MONGOHOST + ':27017/db_deploy');
module.exports = exports = mongoose;
