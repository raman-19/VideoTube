import dotenv from "dotenv"
dotenv.config({
    // path:"../.env"
})
import connectDB from "./db/index.js";
import { app } from "./app.js";




// // console.log("ENV RAW:", process.env)
// console.log("CLOUDE_NAME",process.env.CLOUDINARY_CLOUD_NAME)
// console.log("Api_key",process.env.CLOUDINARY_API_KEY)
// console.log("API_Secret",process.env.CLOUDINARY_API_SECRET)


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000, ()=>{
        console.log(`Server is running on port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!!", err)
})
console.log(process.env.MONGODB_URL);











/*
read dotenv

*/