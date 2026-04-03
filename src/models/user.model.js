import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true //for searching in data base
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudinary
            required:true,
        },
        covetImage:{
            type:String,
        },
        watchHistory:{
            type:Schema.Types.ObjectId,
            ref:"Video",
        },
        password:{
            type:String,
            required:[true, 'Password is required'],
        }


    }, 
    {
        timestamps:true
    }
);

// in modern mongoose allow to skip next()completely if using asynx function.
userSchema.pre("save", async function(){
    if(!this.isModified ("password")) return ; // it check that is password is modified or not . if password is modified than run this if not than move next process
    this.password= await bcrypt.hash(this.password, 10)
    
}) //it takes time to run the program that's why we use async

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.eventNames.ASSESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ASSESS_TOKEN_EXPIRY

        }
    )
}
userSchema.methods.generateRefreshToken = function(){
     return jwt.sign(
        {
            _id:this._id,
        
        },
        process.eventNames.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY

        }
    )


}

export const User = mongoose.model("User", userSchema)