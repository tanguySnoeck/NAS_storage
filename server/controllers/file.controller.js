const Joi = require('joi');
const File = require('../models/file.model');


const FileSchema = Joi.object({
  name: Joi.string().required(),
  path: Joi.string().required(),
  type: Joi.string().required()
})

module.exports = {
  insert
}

async function insert(file) {

  console.log('File: ' +file.name+", path:"+file.path);
  file = await Joi.validate(file, FileSchema, { abortEarly: false });
  
  let newFile = await new File(file).save();
  return newFile;
}