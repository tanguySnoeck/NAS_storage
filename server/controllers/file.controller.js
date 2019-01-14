const Joi = require('joi');
const File = require('../models/file.model');
const FilePermissions = require('../models/filePermissions.model');
const jwtDecode = require("jwt-decode");
const User = require('../models/user.model');
const fs = require('fs');


const FileSchema = Joi.object({
  name: Joi.string().required(),
  path: Joi.string().required(),
  type: Joi.string().required()
})

module.exports = {
  insert,
  deleteFile
}

function deleteFile(req, res) {
  var decoded = jwtDecode(req.headers.authorization.split(' ')[1]);
  userid = decoded._id;
  req = req.body;
  if(decoded.roles.indexOf('admin') == 0) { // Check if user is admin and ifso delete all filepermissions and file entries in DB + file in userDirectory
    FilePermissions.find({fileId:req.fileId}).remove().exec(function(err, filePerm){
      console.log('Filepermissions deleted successfully!');
      if(Object.keys(filePerm).length !== 0){
        File.findByIdAndDelete(req.fileId, function(err,file) {
          if(err) throw err;
          console.log('File with Id: '+req.fileId +' deleted in the database!')
          fs.stat(__dirname+"/../userDirectory/"+file.path+"/"+file.name, function (err, stats) {
            if (err) {
                return console.error(err);
            }         
            fs.unlink(__dirname+"/../userDirectory/"+file.path+"/"+file.name,function(err){
                  if(err) return console.log(err);
                  console.log('file deleted successfully!');
            });  
          });
        });
      }   
    });
  }else{ // Check if user is owner and ifso delete all filepermissions and file entries in DB + file in userDirectory
  FilePermissions.findOneAndDelete({fileId:req.fileId, userId:userid, delete: true}).exec(function(err, filePerm){
    console.log('Filepermissions deleted successfully!');
    if(Object.keys(filePerm).length !== 0){
      File.findByIdAndDelete(req.fileId, function(err,file) {
        if(err) throw err;
        console.log('File with Id: '+req.fileId +' deleted in the database!')
        fs.stat(__dirname+"/../userDirectory/"+file.path+"/"+file.name, function (err, stats) {
          if (err) {
              return console.error(err);
          }         
          fs.unlink(__dirname+"/../userDirectory/"+file.path+"/"+file.name,function(err){
                if(err) return console.log(err);
                console.log('file deleted successfully!');
          });  
        });
      });
    }   
  });
  FilePermissions.find({fileId:req.fileId}).remove().exec(function(err){
    if(err) return console.log(err);
  });
  console.log('All filepermissions deleted successfully!')
  }
}

async function insert(file) {

  console.log('File: ' +file.name+", path:"+file.path);
  file = await Joi.validate(file, FileSchema, { abortEarly: false });
  
  let newFile = await new File(file).save();
  return newFile;
}