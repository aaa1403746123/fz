const mongoose=require('mongoose')
var UserSchema=new mongoose.Schema({
		account:{
            required:true,
            type:String
        },
        password:{
            required:true,
            type:String
        },
        name:{
            required:true,
            type:String
        },
})
var User=mongoose.model('User',UserSchema)
// function a(){
// 	var  d={
// 		 "account":666666,
// 		 "password":'$2b$10$lwJbp5JUkHN8XzdBScn9Hezwa3a.t3yV/5JK.pXiEQHWi8TXOwXzu',
// 		 "name":"王思聪" 
// 	 }
// 	var user=new User(d)
// 	user.save()
// }
// a()


module.exports=User