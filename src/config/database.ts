import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    await mongoose.connect(process.env.ATLAS_DATABASE_URI as string);
};

export default connectDB;