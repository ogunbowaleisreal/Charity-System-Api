import mongoose from "mongoose";
require('dotenv').config()

const connectDB = async (): Promise<void> => {
    try {
        const connection = await mongoose.connect(process.env.ATLAS_DATABASE_URI as string)
    } catch (err) {
        console.log(err)
    }
}

export default connectDB