import { connectDB } from './index.js';

const db = await connectDB();
await db.migrate();
await db.close();
console.log(`User storage prepared for ${db.client}`);
