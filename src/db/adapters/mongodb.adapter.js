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

// ---------------------------------------------------------------------------
// SavedDesign — independent document, one per saved design per user
// ---------------------------------------------------------------------------
const savedDesignSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    designName:   { type: String, default: 'My Design', trim: true },
    status:       { type: String, enum: ['draft', 'saved', 'ordered'], default: 'saved', index: true },
    // Product info
    productId:    { type: String, required: true, trim: true, index: true },
    productName:  { type: String, required: true, trim: true },
    productSlug:  { type: String, default: null, trim: true },
    category:     { type: String, default: null, trim: true },
    subcategory:  { type: String, default: null, trim: true },
    // Variant selection
    color:        { type: String, default: null, trim: true },
    size:         { type: String, default: null, trim: true },
    quantity:     { type: Number, default: 1, min: 1 },
    orderType:    { type: String, enum: ['plain', 'customize', 'bulk'], default: 'customize' },
    printingMethod: { type: String, default: null, trim: true },
    // Pricing snapshot
    price:        { type: Number, default: 0 },
    totalPrice:   { type: Number, default: 0 },
    // Full editor state — all logos, slots, text, layer order, etc.
    editorConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Legacy customization object for compatibility
    customization:{ type: mongoose.Schema.Types.Mixed, default: {} },
    // View images map: { front, back, left, right }
    viewImages:   { type: mongoose.Schema.Types.Mixed, default: {} },
    // Primary preview (front)
    previewImage: { type: String, default: null },
    // Notes / instructions
    notes:        { type: String, default: null },
    // Soft-delete
    deletedAt:    { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

// Compound index for fast user-centric queries
savedDesignSchema.index({ userId: 1, createdAt: -1 });
savedDesignSchema.index({ userId: 1, productId: 1, status: 1 });

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

const toSavedDesign = (doc) =>
  doc && {
    id:             doc._id.toString(),
    userId:         doc.userId?.toString(),
    designName:     doc.designName,
    status:         doc.status,
    productId:      doc.productId,
    productName:    doc.productName,
    productSlug:    doc.productSlug,
    category:       doc.category,
    subcategory:    doc.subcategory,
    color:          doc.color,
    size:           doc.size,
    quantity:       Number(doc.quantity ?? 1),
    orderType:      doc.orderType || 'customize',
    printingMethod: doc.printingMethod,
    price:          Number(doc.price ?? 0),
    totalPrice:     Number(doc.totalPrice ?? 0),
    editorConfig:   doc.editorConfig || {},
    customization:  doc.customization || {},
    viewImages:     doc.viewImages || {},
    previewImage:   doc.previewImage,
    notes:          doc.notes,
    createdAt:      doc.createdAt,
    updatedAt:      doc.updatedAt,
  };

export const createMongoDbAdapter = async (env) => {
  const connection = await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
  const User = connection.models.User || connection.model('User', userSchema);
  const Product = connection.models.Product || connection.model('Product', productSchema);
  const Order = connection.models.Order || connection.model('Order', orderSchema);
  const SavedDesign = connection.models.SavedDesign || connection.model('SavedDesign', savedDesignSchema);

  return Object.freeze({
    client: 'mongodb',

    checkConnection: async () => {
      await connection.connection.db.admin().ping();
    },

    migrate: async () => {
      await User.init();
      await Product.init();
      await Order.init();
      await SavedDesign.init();
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

    savedDesigns: Object.freeze({
      findAllByUser: async (userId, { page = 1, limit = 20, status, productId, category, printingMethod, search, sortBy = 'updatedAt', sortOrder = 'desc' } = {}) => {
        if (!mongoose.isValidObjectId(userId)) return { items: [], total: 0 };
        const query = { userId: new mongoose.Types.ObjectId(userId), deletedAt: null };
        if (status) query.status = status;
        if (productId) query.productId = productId;
        if (category) query.category = category;
        if (printingMethod) query.printingMethod = printingMethod;
        if (search) query.$or = [{ designName: { $regex: search, $options: 'i' } }, { productName: { $regex: search, $options: 'i' } }];
        const sortDir = sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortDir };
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
          SavedDesign.find(query).sort(sort).skip(skip).limit(limit).lean(),
          SavedDesign.countDocuments(query),
        ]);
        return { items: items.map(toSavedDesign), total };
      },

      findById: async (id) => {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await SavedDesign.findOne({ _id: id, deletedAt: null });
        return toSavedDesign(doc);
      },

      create: async (data) => {
        const doc = await SavedDesign.create(data);
        return toSavedDesign(doc);
      },

      update: async (id, fields) => {
        if (!mongoose.isValidObjectId(id)) return null;
        const doc = await SavedDesign.findByIdAndUpdate(
          id,
          { $set: fields },
          { new: true, runValidators: true },
        );
        return toSavedDesign(doc);
      },

      softDelete: async (id) => {
        if (!mongoose.isValidObjectId(id)) return false;
        const result = await SavedDesign.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
        return !!result;
      },

      countByUser: async (userId) => {
        if (!mongoose.isValidObjectId(userId)) return 0;
        return SavedDesign.countDocuments({ userId: new mongoose.Types.ObjectId(userId), deletedAt: null });
      },
    }),

    close: () => mongoose.disconnect(),
  });
};
