const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//create a schema
const pageSchema = new Schema({
  name: {type: String, required: true},
  type: {type: String, enum:['vous-etes','cgu', 'home']},
  content:{type: String},
  createdAt: Date,
  updatedAt: Date
});    

const page = mongoose.model('page', pageSchema);
module.exports = page;
