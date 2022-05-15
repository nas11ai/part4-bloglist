const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  passwordHash: String,
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    const {
      _id, __v, passwordHash, ...obj
    } = returnedObject;
    return { ...obj, id: _id.toString() };
  },
});

module.exports = mongoose.model('User', userSchema);
