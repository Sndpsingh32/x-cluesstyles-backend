import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone:       { type: String, required: true, unique: true, trim: true },
    fullName:    { type: String, default: null, trim: true },
    email:       { type: String, default: null, unique: true, sparse: true, trim: true, lowercase: true },
    avatar:      { type: String, default: null },
    // Delivery / billing address
    addressLine: { type: String, default: null },
    city:        { type: String, default: null },
    state:       { type: String, default: null },
    pincode:     { type: String, default: null },
    country:     { type: String, default: 'India' },
    role:        { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true, versionKey: false },
);

/** Map a Mongoose document to a plain public-safe object */
const toUser = (doc) =>
  doc && {
    id:          doc._id.toString(),
    phone:       doc.phone,
    fullName:    doc.fullName,
    email:       doc.email,
    avatar:      doc.avatar,
    addressLine: doc.addressLine,
    city:        doc.city,
    state:       doc.state,
    pincode:     doc.pincode,
    country:     doc.country,
    role:        doc.role,
    createdAt:   doc.createdAt,
    updatedAt:   doc.updatedAt,
  };

export const createMongoDbAdapter = async (env) => {
  const connection = await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
  const User = connection.models.User || connection.model('User', userSchema);

  return Object.freeze({
    client: 'mongodb',

    checkConnection: async () => {
      await connection.connection.db.admin().ping();
    },

    migrate: () => User.init(),

    users: Object.freeze({
      findById: async (id) =>
        mongoose.isValidObjectId(id) ? toUser(await User.findById(id)) : null,

      findByPhone: async (phone) =>
        toUser(await User.findOne({ phone })),

      findByEmail: async (email) =>
        toUser(await User.findOne({ email })),

      existsByPhone: async (phone) =>
        !!(await User.exists({ phone })),

      existsByEmail: async (email, excludeId = null) => {
        const doc = await User.findOne({ email }).select('_id').lean();
        if (!doc) return false;
        return excludeId ? doc._id.toString() !== excludeId : true;
      },

      /** Register a new user — only phone required */
      create: async ({ id, phone, role = 'user' }) => {
        // MongoDB generates its own _id; ignore the supplied UUID id for Mongo
        const doc = await User.create({ phone, role });
        return toUser(doc);
      },

      update: async (id, fields) => {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await User.findByIdAndUpdate(
          id,
          { $set: fields },
          { new: true, runValidators: true },
        );
        return toUser(doc);
      },
    }),

    close: () => mongoose.disconnect(),
  });
};
