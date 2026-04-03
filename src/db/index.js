import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)

    }catch(err){
        console.error("Mongodb connection error",err);
        process.exit(1)
    }
}

export default connectDB;


/*
read abour exit(1);
doing clg connectionInstance
nodejs error class
in express we use response in this 
status code
*/

// ( async()=>{
//     try{
//         await mongoose.connect(`${proceess.env.MONGODB_URL}/${BD_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERROR:", error);
//             throw error;
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on post ${process.env.PORT}`)
//         })


//     }
//     catch(err){
//         console.log("ERROR",err);
//         throw err;
//     }

// })