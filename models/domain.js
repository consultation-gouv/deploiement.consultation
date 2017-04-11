const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//create a schema
const domainSchema = new Schema({
  domain:{type: String},
  createdAt: Date,
  updatedAt: Date
});    

const domain = mongoose.model('domain', domainSchema);
module.exports = domain;
