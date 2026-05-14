import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/infectonet';

// Re-use connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | undefined;
}

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached && mongoose.connection.readyState === 1) {
    return cached;
  }

  cached = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });

  global._mongooseConn = cached;
  return cached;
}

export default connectDB;
