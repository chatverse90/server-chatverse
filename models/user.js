const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({

  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  badge: {type: String , default: 'https://i.ibb.co/QnPsszX/normal.png'},
  pic: { type: String , default: 'https://i.ibb.co/HpNGXpK/businessman.png'},
  backgroundPic: { type: String,default: 'https://i.ibb.co/HpNGXpK/businessman.png' },
  bio: {type: String , default: 'Hey There! This is my bio '}
});

const User=mongoose.model("User",userSchema);
module.exports=User;