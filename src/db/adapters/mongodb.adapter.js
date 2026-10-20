import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    category:    { type: String, default: 'uncategorized', trim: true },
    subcategory: { type: String, default: null, trim: true },
    description: { type: String, default: null },
    image:       { type: String, default: null },
    price:       { type: Number, default: 0 },
    compareAtPrice: { type: Number, default: null },
    stock:       { type: Number, default: 0 },
    active:      { type: Boolean, default: true },
    featured:    { type: Boolean, default: false },
    tags:        [{ type: String }],
    colors:      [{ type: String }],
    sizes:       [{ type: String }],
    attributes:  { type: mongoose.Schema.Types.Mixed, default: {} },
    customization: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false },
);

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

const orderSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    slug: { type: String, default: null, trim: true },
    category: { type: String, default: null, trim: true },
    subcategory: { type: String, default: null, trim: true },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    orderType: { type: String, enum: ['plain', 'customize', 'bulk'], default: 'plain' },
    quantityMode: { type: String, enum: ['single', 'bulk'], default: 'single' },
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    status: { type: String, default: 'pending', trim: true },
    source: { type: String, default: 'frontend', trim: true },
    customerName: { type: String, default: null, trim: true },
    phone: { type: String, default: null, trim: true },
    customization: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, default: null },
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

const toProduct = (doc) =>
  doc && {
    id: doc._id.toString(),
    category: doc.category,
    subcategory: doc.subcategory,
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    image: doc.image,
    price: Number(doc.price ?? 0),
    compareAtPrice: doc.compareAtPrice ?? null,
    stock: Number(doc.stock ?? 0),
    active: !!doc.active,
    featured: !!doc.featured,
    tags: doc.tags || [],
    colors: doc.colors || [],
    sizes: doc.sizes || [],
    attributes: doc.attributes || {},
    customization: doc.customization || {},
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

const toOrder = (doc) =>
  doc && {
    id: doc._id.toString(),
    productId: doc.productId,
    productName: doc.productName,
    slug: doc.slug,
    category: doc.category,
    subcategory: doc.subcategory,
    color: doc.color,
    size: doc.size,
    quantity: Number(doc.quantity ?? 1),
    orderType: doc.orderType || 'plain',
    quantityMode: doc.quantityMode || 'single',
    unitPrice: Number(doc.unitPrice ?? 0),
    totalPrice: Number(doc.totalPrice ?? 0),
    status: doc.status || 'pending',
    source: doc.source || 'frontend',
    customerName: doc.customerName || null,
    phone: doc.phone || null,
    customization: doc.customization || {},
    notes: doc.notes || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

export const createMongoDbAdapter = async (env) => {
  const connection = await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
  const User = connection.models.User || connection.model('User', userSchema);
  const Product = connection.models.Product || connection.model('Product', productSchema);
  const Order = connection.models.Order || connection.model('Order', orderSchema);

  return Object.freeze({
    client: 'mongodb',

    checkConnection: async () => {
      await connection.connection.db.admin().ping();
    },

    migrate: async () => {
      await User.init();
      await Product.init();
      await Order.init();
    },

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

    products: Object.freeze({
      findAll: async (filters = {}) => {
        const query = {};
        if (filters.active !== undefined) query.active = !!filters.active;
        if (filters.featured !== undefined) query.featured = !!filters.featured;
        if (filters.category) query.category = filters.category;
        if (filters.subcategory) query.subcategory = filters.subcategory;
        return (await Product.find(query).sort({ createdAt: -1 })).map(toProduct);
      },
      findById: async (id) => (mongoose.isValidObjectId(id) ? toProduct(await Product.findById(id)) : null),
      findBySlug: async (slug) => toProduct(await Product.findOne({ slug })),
      existsBySlug: async (slug, excludeId = null) => {
        const doc = await Product.findOne({ slug }).select('_id').lean();
        if (!doc) return false;
        return excludeId ? doc._id.toString() !== excludeId : true;
      },
      create: async (data) => toProduct(await Product.create(data)),
      update: async (id, fields) => toProduct(await Product.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true })),
      delete: async (id) => {
        const result = await Product.deleteOne({ _id: id });
        return result.deletedCount > 0;
      },
    }),

    orders: Object.freeze({
      findAll: async (filters = {}) => {
        const query = {};
        if (filters.status) query.status = filters.status;
        if (filters.orderType) query.orderType = filters.orderType;
        if (filters.productId) query.productId = filters.productId;
        return (await Order.find(query).sort({ createdAt: -1 })).map(toOrder);
      },
      findById: async (id) => (mongoose.isValidObjectId(id) ? toOrder(await Order.findById(id)) : null),
      create: async (data) => toOrder(await Order.create(data)),
      update: async (id, fields) => toOrder(await Order.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true })),
      delete: async (id) => {
        const result = await Order.deleteOne({ _id: id });
        return result.deletedCount > 0;
      },
    }),

    close: () => mongoose.disconnect(),
  });
};
