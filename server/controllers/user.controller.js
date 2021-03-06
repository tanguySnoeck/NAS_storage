const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/user.model');
const fileCtrl = require('../controllers/file.controller');
const permissionsCtrl = require('../controllers/filePermissions.controller');
const WrongStatusError = require('../errors').WrongStatusError
const fs = require('fs-extra');

const userSchema = Joi.object({
  fullname: Joi.string().required(),
  status: Joi.string().required().regex(/^Waiting$/),
  password: Joi.string().required().min(10).regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{10,}$/),// au moins une lettre majuscule, une minuscule, un chiffre et un caractère spécial
  repeatPassword: Joi.string().required().valid(Joi.ref('password')),
  roles: Joi.array().required(),
  secret: Joi.string().required()
})

const states = {
  WAITING: "Waiting",
  ACTIVE: "Active",
  DEACTIVATED: "Deactivated",
  DELETED: "Deleted"
}

async function insert(user) {
  if (user.roles.indexOf('admin') < 0 && user.status !== "Waiting")
    throw new WrongStatusError ('A user must be waiting when registering')

  user = await Joi.validate(user, userSchema, { abortEarly: false });
  user.hashedPassword = bcrypt.hashSync(user.password, 10);
  delete user.password;
  user.secret;

  const nbOfUser = await User.find({});

  if (nbOfUser.length < 1) {
    user.roles.push('admin');
    user.status = "Active";
  }
  const userDb = await new User(user).save();
  createDirectory(userDb);
  initDefaultPermissions(userDb);
  return userDb;
}

async function setStatus(user) {
  let userDb
  
  try {
    userDb = await User.findById(user._id)
  } catch (e) {
    e.message = "You are trying to change the status of a user that does not exist"
    throw e
  }
  
  const newStatus = user.newStatus;
  
  if (Object.values(states).indexOf(newStatus) < 0) 
    throw new WrongStatusError('Status does not exist')

  if (userDb.roles.indexOf('admin') > -1) 
    throw new WrongStatusError('An admin can not change the status of another admin')

  if (userDb.status == states.DELETED)
    throw new WrongStatusError('A deleted user can not change status')

  if (newStatus == states.WAITING)
    throw new WrongStatusError ('A user can not go back to waiting status')
  
  if (userDb.status == states.WAITING && newStatus == states.DEACTIVATED)
    throw new WrongStatusError ('You can not deactivate a user who is not active')

  try {
    await User.updateOne(userDb, {'status': newStatus})
  } catch(e) {
    e.message = 'There was an error updating user ' + userDb.fullname
    throw e
  }

    createDirectory(userDb);
    initDefaultPermissions(userDb);
}

async function getAllNonActive() {
  return await User.find(
    { $and: [
      { $or: [{ status: "Waiting" }, { status: "Active" }, {status: "Deactivated"}] },
      { roles: {$nin: ['admin']} }
    ]}, 
    { fullname: 1, status: 1, });
}

function createDirectory(doc) {
  fullname = doc.fullname;
  var dir = __dirname + "/../userDirectory/"+ fullname;
  if (!fs.existsSync(dir)){
    fs.ensureDirSync(dir);
  }
}

function initDefaultPermissions(doc) {
  let rootFolder = {
    'name': doc.fullname,
    'path': '/',
    'type': 'd'
  }

  //First, insert file
  fileCtrl.insert(rootFolder).then(
    (insertedFile) => {
      let permissionToCreate = {
        'fileId': insertedFile._id,
        'userId': doc._id,
        'read': true,
        'write': true,
        'delete': true,
        'isOwner': true,
      };

      //Then, insert file permission
      permissionsCtrl.insert(permissionToCreate);
    }
  );

}

module.exports = {
  insert,
  setStatus,
  getAllNonActive
}