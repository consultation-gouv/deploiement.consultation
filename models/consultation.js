const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//create a schema
const consultationSchema = new Schema({
  _id: {type: String, required: true, unique: true},
  name: {type: String, trim: true, required: true},
  url: {type: String, required: true, trim: true, default: 'url'},
  slug: {type: String,required: true,lowercase: true,trim: true,min:5, max:25,match: /^[a-z0-9\-]+$/},
  status: {type: String, required: true, default: 'requested', enum:['requested','running','failure','terminated']},
  adminName: {type: String, trim: true, required: true},
  adminEmail: {type: String, trim: true, required: true},
  adminPhone: {type: String},
  adminOrganizationName: {type: String, trim: true, required: true},
  metadata: {type: Object},
  toolname: {type: String, required: true},
  createdAt: Date,
  updatedAt: Date
});    

// to return to clients a cleaner json object
consultationSchema.set('toJSON', {transform: function(doc, ret, options) {
  ret.id = ret._id;
  delete ret._id;
  delete ret.hosting;
  delete ret.__v;
  delete ret.toolname;
  return ret;
}, getters: true, virtuals: false});

const consultation = mongoose.model('consultation', consultationSchema);
module.exports = consultation;
