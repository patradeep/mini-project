const { name } = require("ejs");
const mongoose=require("mongoose");
// let DB=process.env.DB

mongoose.connect("mongodb+srv://deepanjanpatra6:deep123@y123.34mjp.mongodb.net/");

const userschema=mongoose.Schema({
  username:String,
  name:String,
  age:Number,
  email:String,
  password:String,
  posts:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"post"
    }
  ]
})

module.exports =mongoose.model("user", userschema);