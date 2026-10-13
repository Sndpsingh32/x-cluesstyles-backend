import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({ fullName: { type: String, required: true, trim: true }, username: { type: String, required: true, trim: true, lowercase: true, unique: true }, email: { type: String, required: true, trim: true, lowercase: true, unique: true }, passwordHash: { type: String, required: true }, avatar: { type: String, default: null } }, { timestamps: true, versionKey: false });
const toUser = (document) => document && ({ id: document._id.toString(), fullName: document.fullName, username: document.username, email: document.email, avatar: document.avatar, createdAt: document.createdAt, updatedAt: document.updatedAt });

export const createMongoDbAdapter = async (env) => {
  const connection = await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
  const User = connection.models.User || connection.model('User', userSchema);
  return Object.freeze({
    client: 'mongodb', checkConnection: async () => { await connection.connection.db.admin().ping(); }, migrate: () => User.init(),
    users: Object.freeze({
      findById: async (id) => mongoose.isValidObjectId(id) ? toUser(await User.findById(id)) : null,
      findByEmail: async (email) => toUser(await User.findOne({ email })),
      findByLogin: async (login) => { const user = await User.findOne({ $or: [{ username: login }, { email: login }] }); return user && { ...toUser(user), passwordHash: user.passwordHash }; },
      findByEmailOrUsername: async (email, username) => toUser(await User.findOne({ $or: [{ email }, { username }] })),
      create: async ({ fullName, username, email, passwordHash, avatar }) => toUser(await User.create({ fullName, username, email, passwordHash, avatar })),
      update: async (id, fields) => mongoose.isValidObjectId(id) ? toUser(await User.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true })) : null,
    }), close: () => mongoose.disconnect(),
  });
};
