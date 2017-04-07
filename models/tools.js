const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//create a schema
const toolSchema = new Schema({
  name: {type: String, required: true},
  license: {type: String, required: true},
  apiKey: {type: String, required: true},
  apiKey_patch: {type: String},
  urlApi: {type: String, required: true},
  urlPlatform: {type: String, required: true},
  platformName: {type: String},
  hostDomain: {type: String},
  hosting: {type: String},
  email: {type: String},
  documentation: {type: String},
  usages:{type: String},
  logo:{type: String},
  demo:{type: String},
  online: {type: Boolean},
  createdAt: Date,
  updatedAt: Date
});    

const tool = mongoose.model('tool', toolSchema);
module.exports = tool;
