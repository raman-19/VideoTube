import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, // on who is subscriber
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, // on who is channel
        ref:"User"
    }
},{
    timestamps:true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)  