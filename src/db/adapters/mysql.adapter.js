import mysql from 'mysql2/promise';

export const parseJsonField = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed === null) return fallback;
      return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  if (Array.isArray(value) || typeof value === 'object') return value;
  return fallback;
};

export const createMySqlAdapter = (env) => {
  const pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    database: env.MYSQL_DATABASE,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    waitForConnections: true,
    connectionLimit: env.MYSQL_CONNECTION_LIMIT,
    namedPlaceholders: true,
  });

  const query   = async (sql, values = {}) => (await pool.execute(sql, values))[0];
  const findOne = async (sql, values)      => (await query(sql, values))[0] ?? null;

  // -------------------------------------------------------------------------
  // Column selects
  // -------------------------------------------------------------------------
  const userCols = `
    id, phone, full_name AS fullName, email, avatar,
    address_line AS addressLine, city, state, pincode, country,
    customizations, role, created_at AS createdAt, updated_at AS updatedAt
  `;

  const catCols = `
    id, name, slug, description, image,
    is_active AS isActive, sort_order AS sortOrder,
    created_at AS createdAt, updated_at AS updatedAt
  `;

  const subCatCols = `
    s.id, s.category_id AS categoryId, c.name AS categoryName, s.name, s.slug, s.description, s.image,
    s.is_active AS isActive, s.sort_order AS sortOrder,
    s.created_at AS createdAt, s.updated_at AS updatedAt
  `;

  const subSubCatCols = `
    ss.id, ss.subcategory_id AS subcategoryId, sc.name AS subcategoryName, c.name AS categoryName, ss.name, ss.slug, ss.description, ss.image,
    ss.is_active AS isActive, ss.sort_order AS sortOrder,
    ss.created_at AS createdAt, ss.updated_at AS updatedAt
  `;

  const productCols = `
    id, sku, category, subcategory, subsubcategory, name, slug, brand, short_description AS shortDescription, description, type,
    status, image, thumbnail, price, compare_at_price AS compareAtPrice, cost_price AS costPrice,
    tax_category AS taxCategory, min_order_qty AS minOrderQty, stock_managed AS stockManaged,
    stock, backorder, availability, shipping_weight AS shippingWeight, dimensions,
    bulk_pricing AS bulkPricing, quantity_discount AS quantityDiscount, coupon_eligible AS couponEligible,
    active, featured, tags, colors, sizes, images, specifications, features, variants,
    attributes, customization, seo, created_at AS createdAt, updated_at AS updatedAt
  `;

  const orderCols = `
    id, product_id AS productId, product_name AS productName, slug, category, subcategory, color, size,
    quantity, order_type AS orderType, quantity_mode AS quantityMode, unit_price AS unitPrice,
    total_price AS totalPrice, status, source, customer_name AS customerName, phone,
    customization, notes, created_at AS createdAt, updated_at AS updatedAt
  `;

  const buildListResult = (items, total, page, limit, sortBy = 'name', sortDir = 'asc') => {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Number(limit) : items.length || 10;
    const safeTotal = Number(total) || 0;
    return {
      items,
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(safeTotal / safeLimit || 1)),
      sortBy,
      sortDir,
    };
  };

  const buildSortClause = (tableAlias, field, sortDir = 'asc') => {
    const dir = sortDir === 'desc' ? 'DESC' : 'ASC';
    switch (field) {
      case 'category':
        return `c.name ${dir}, ${tableAlias}.name ASC`;
      case 'created':
        return `${tableAlias}.created_at ${dir}, ${tableAlias}.name ASC`;
      case 'status':
      case 'active':
        return `${tableAlias}.is_active ${dir}, ${tableAlias}.name ASC`;
      case 'products':
        return `${tableAlias}.name ${dir}`;
      default:
        return `${tableAlias}.name ${dir}`;
    }
  };

  // -------------------------------------------------------------------------
  // Migration — creates all 5 tables
  // -------------------------------------------------------------------------
  const migrate = async () => {
    // 1. users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id           CHAR(36)      NOT NULL PRIMARY KEY,
        phone        VARCHAR(20)   NOT NULL UNIQUE,
        full_name    VARCHAR(100)  NULL,
        email        VARCHAR(255)  NULL UNIQUE,
        avatar       VARCHAR(2048) NULL,
        address_line VARCHAR(255)  NULL,
        city         VARCHAR(100)  NULL,
        state        VARCHAR(100)  NULL,
        pincode      VARCHAR(10)   NULL,
        country      VARCHAR(100)  NULL DEFAULT 'India',
        customizations JSON        NULL,
        role         ENUM('user','admin') NOT NULL DEFAULT 'user',
        created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. categories (level 1)
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          CHAR(36)      NOT NULL PRIMARY KEY,
        name        VARCHAR(100)  NOT NULL,
        slug        VARCHAR(120)  NOT NULL UNIQUE,
        description VARCHAR(500)  NULL,
        image       VARCHAR(8192) NULL,
        is_active   TINYINT(1)    NOT NULL DEFAULT 1,
        sort_order  INT           NOT NULL DEFAULT 0,
        created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. subcategories (level 2) — FK → categories.id
    await query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id            CHAR(36)      NOT NULL PRIMARY KEY,
        category_id   CHAR(36)      NOT NULL,
        name          VARCHAR(100)  NOT NULL,
        slug          VARCHAR(120)  NOT NULL UNIQUE,
        description   VARCHAR(500)  NULL,
        image         VARCHAR(8192) NULL,
        is_active     TINYINT(1)    NOT NULL DEFAULT 1,
        sort_order    INT           NOT NULL DEFAULT 0,
        created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sub_category
          FOREIGN KEY (category_id) REFERENCES categories (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 4. subsubcategories (level 3) — FK → subcategories.id
    await query(`
      CREATE TABLE IF NOT EXISTS subsubcategories (
        id               CHAR(36)      NOT NULL PRIMARY KEY,
        subcategory_id   CHAR(36)      NOT NULL,
        name             VARCHAR(100)  NOT NULL,
        slug             VARCHAR(120)  NOT NULL UNIQUE,
        description      VARCHAR(500)  NULL,
        image            TEXT          NULL,
        is_active        TINYINT(1)    NOT NULL DEFAULT 1,
        sort_order       INT           NOT NULL DEFAULT 0,
        created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_subsub_subcategory
          FOREIGN KEY (subcategory_id) REFERENCES subcategories (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    const ensureTextColumn = async (tableName, columnName, definition = 'TEXT NULL') => {
      const [existing] = await pool.execute(`SHOW COLUMNS FROM ${tableName}`);
      const column = existing.find((entry) => entry.Field === columnName || entry.field === columnName);
      if (!column) {
        await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        return;
      }
      const type = String(column.Type || '').toLowerCase();
      if (!type.includes('text')) {
        await query(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${definition}`);
      }
    };

    const ensureJsonColumn = async (tableName, columnName, definition = 'JSON NULL') => {
      const [existing] = await pool.execute(`SHOW COLUMNS FROM ${tableName}`);
      const column = existing.find((entry) => entry.Field === columnName || entry.field === columnName);
      if (!column) {
        await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
        return;
      }
      const type = String(column.Type || '').toLowerCase();
      if (!type.includes('json')) {
        await query(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${definition}`);
      }
    };

    await ensureTextColumn('categories', 'image');
    await ensureTextColumn('subcategories', 'image');
    await ensureTextColumn('subsubcategories', 'image');
    await ensureJsonColumn('users', 'customizations');

    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id               CHAR(36)      NOT NULL PRIMARY KEY,
        sku              VARCHAR(80)   NULL,
        category         VARCHAR(80)   NOT NULL,
        subcategory      VARCHAR(80)   NULL,
        subsubcategory   VARCHAR(80)   NULL,
        name             VARCHAR(120)  NOT NULL,
        slug             VARCHAR(120)  NOT NULL UNIQUE,
        brand            VARCHAR(120)  NULL,
        short_description TEXT         NULL,
        description      TEXT          NULL,
        type             VARCHAR(60)   NULL,
        status           VARCHAR(40)   NULL DEFAULT 'Draft',
        image            VARCHAR(8192) NULL,
        thumbnail        VARCHAR(8192) NULL,
        price            DECIMAL(10,2) NOT NULL DEFAULT 0,
        compare_at_price DECIMAL(10,2) NULL,
        cost_price      DECIMAL(10,2) NULL,
        tax_category     VARCHAR(80)   NULL,
        min_order_qty    INT           NOT NULL DEFAULT 1,
        stock_managed    TINYINT(1)    NOT NULL DEFAULT 1,
        stock            INT           NOT NULL DEFAULT 0,
        backorder        TINYINT(1)    NOT NULL DEFAULT 0,
        availability     VARCHAR(80)   NULL,
        shipping_weight  VARCHAR(80)   NULL,
        dimensions       VARCHAR(120)  NULL,
        bulk_pricing     VARCHAR(200)  NULL,
        quantity_discount VARCHAR(200) NULL,
        coupon_eligible  TINYINT(1)    NOT NULL DEFAULT 0,
        active           TINYINT(1)    NOT NULL DEFAULT 1,
        featured         TINYINT(1)    NOT NULL DEFAULT 0,
        tags             JSON          NULL,
        colors           JSON          NULL,
        sizes            JSON          NULL,
        images           JSON          NULL,
        specifications   JSON          NULL,
        features         JSON          NULL,
        variants         JSON          NULL,
        attributes       JSON          NULL,
        customization    JSON          NULL,
        seo              JSON          NULL,
        created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id            CHAR(36)      NOT NULL PRIMARY KEY,
        product_id    VARCHAR(120)  NOT NULL,
        product_name  VARCHAR(200)  NOT NULL,
        slug          VARCHAR(200)  NULL,
        category      VARCHAR(80)   NULL,
        subcategory   VARCHAR(80)   NULL,
        color         VARCHAR(80)   NOT NULL,
        size          VARCHAR(40)   NOT NULL,
        quantity      INT           NOT NULL DEFAULT 1,
        order_type    VARCHAR(20)   NOT NULL DEFAULT 'plain',
        quantity_mode VARCHAR(20)   NOT NULL DEFAULT 'single',
        unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
        status        VARCHAR(40)   NOT NULL DEFAULT 'pending',
        source        VARCHAR(40)   NOT NULL DEFAULT 'frontend',
        customer_name VARCHAR(120)  NULL,
        phone         VARCHAR(30)   NULL,
        customization JSON          NULL,
        notes         TEXT          NULL,
        created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const ensureColumn = async (name, definition) => {
      const [existing] = await pool.execute('SHOW COLUMNS FROM products');
      const columnExists = existing.some((column) => column.Field === name || column.field === name);
      if (!columnExists) {
        await query(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
      }
    };

    await ensureColumn('sku', 'VARCHAR(80) NULL');
    await ensureColumn('subsubcategory', 'VARCHAR(80) NULL');
    await ensureColumn('brand', 'VARCHAR(120) NULL');
    await ensureColumn('short_description', 'TEXT NULL');
    await ensureColumn('type', 'VARCHAR(60) NULL');
    await ensureColumn('status', 'VARCHAR(40) NULL DEFAULT "Draft"');
    await ensureColumn('thumbnail', 'VARCHAR(8192) NULL');
    await ensureColumn('cost_price', 'DECIMAL(10,2) NULL');
    await ensureColumn('tax_category', 'VARCHAR(80) NULL');
    await ensureColumn('min_order_qty', 'INT NOT NULL DEFAULT 1');
    await ensureColumn('stock_managed', 'TINYINT(1) NOT NULL DEFAULT 1');
    await ensureColumn('backorder', 'TINYINT(1) NOT NULL DEFAULT 0');
    await ensureColumn('availability', 'VARCHAR(80) NULL');
    await ensureColumn('shipping_weight', 'VARCHAR(80) NULL');
    await ensureColumn('dimensions', 'VARCHAR(120) NULL');
    await ensureColumn('bulk_pricing', 'VARCHAR(200) NULL');
    await ensureColumn('quantity_discount', 'VARCHAR(200) NULL');
    await ensureColumn('coupon_eligible', 'TINYINT(1) NOT NULL DEFAULT 0');
    await ensureColumn('images', 'JSON NULL');
    await ensureColumn('specifications', 'JSON NULL');
    await ensureColumn('features', 'JSON NULL');
    await ensureColumn('variants', 'JSON NULL');
    await ensureColumn('seo', 'JSON NULL');
  };

  // -------------------------------------------------------------------------
  // users
  // -------------------------------------------------------------------------
  const users = Object.freeze({
    findById: async (id) => {
      const row = await findOne(`SELECT ${userCols} FROM users WHERE id = :id`, { id });
      if (!row) return null;
      return { ...row, customizations: parseJsonField(row.customizations, []) };
    },

    findByPhone: async (phone) => {
      const row = await findOne(`SELECT ${userCols} FROM users WHERE phone = :phone`, { phone });
      if (!row) return null;
      return { ...row, customizations: parseJsonField(row.customizations, []) };
    },

    findByEmail: async (email) => {
      const row = await findOne(`SELECT ${userCols} FROM users WHERE email = :email`, { email });
      if (!row) return null;
      return { ...row, customizations: parseJsonField(row.customizations, []) };
    },

    existsByPhone: async (phone) =>
      !!(await findOne('SELECT id FROM users WHERE phone = :phone', { phone })),

    existsByEmail: async (email, excludeId = null) => {
      const row = await findOne('SELECT id FROM users WHERE email = :email', { email });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    create: async ({ id, phone, role = 'user', customizations = [] }) => {
      await query(
        'INSERT INTO users (id, phone, role, customizations) VALUES (:id, :phone, :role, :customizations)',
        { id, phone, role, customizations: JSON.stringify(customizations) },
      );
      return users.findById(id);
    },

    update: async (id, fields) => {
      const columnMap = {
        fullName: 'full_name', email: 'email', avatar: 'avatar',
        addressLine: 'address_line', city: 'city', state: 'state',
        pincode: 'pincode', country: 'country', customizations: 'customizations',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return users.findById(id);
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      const payload = { ...Object.fromEntries(valid), id };
      if (payload.customizations) payload.customizations = JSON.stringify(payload.customizations);
      await query(`UPDATE users SET ${assignments} WHERE id = :id`, payload);
      return users.findById(id);
    },
  });

  // -------------------------------------------------------------------------
  // categories  (level 1)
  // -------------------------------------------------------------------------
  const categories = Object.freeze({
    findAll: async ({ isActive, search, q, sortBy = 'name', sortDir = 'asc', page = 1, limit = 10 } = {}) => {
      const searchTerm = (search ?? q ?? '').trim();
      const conditions = [];
      const vals = {};

      if (isActive !== undefined) {
        conditions.push('is_active = :isActive');
        vals.isActive = isActive ? 1 : 0;
      }

      if (searchTerm) {
        conditions.push('(LOWER(name) LIKE :search OR LOWER(slug) LIKE :search OR LOWER(description) LIKE :search)');
        vals.search = `%${searchTerm.toLowerCase()}%`;
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const totalRow = await findOne(`SELECT COUNT(*) AS total FROM categories ${where}`, vals);
      const total = Number(totalRow?.total || 0);
      const offset = (safePage - 1) * safeLimit;
      const rows = await query(
        `SELECT ${catCols} FROM categories ${where} ORDER BY ${buildSortClause('categories', sortBy, sortDir)}, name ASC LIMIT :limit OFFSET :offset`,
        { ...vals, limit: safeLimit, offset },
      );

      return buildListResult(rows, total, safePage, safeLimit, sortBy, sortDir);
    },

    findById: (id) =>
      findOne(`SELECT ${catCols} FROM categories WHERE id = :id`, { id }),

    findBySlug: (slug) =>
      findOne(`SELECT ${catCols} FROM categories WHERE slug = :slug`, { slug }),

    existsBySlug: async (slug, excludeId = null) => {
      const row = await findOne('SELECT id FROM categories WHERE slug = :slug', { slug });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    /** Fetch category + all its subcategories + each sub's subsubcategories */
    findByIdWithChildren: async (id) => {
      const category = await findOne(
        `SELECT ${catCols} FROM categories WHERE id = :id`, { id },
      );
      if (!category) return null;

      const subs = await query(
        `SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.category_id = :id ORDER BY s.sort_order ASC, s.name ASC`,
        { id },
      );

      category.subcategories = await Promise.all(
        subs.map(async (sub) => {
          sub.subsubcategories = await query(
            `SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.subcategory_id = :subId ORDER BY ss.sort_order ASC, ss.name ASC`,
            { subId: sub.id },
          );
          return sub;
        }),
      );
      return category;
    },

    /** Full tree — all categories with nested subs */
    findTree: async () => {
      const cats = await query(
        `SELECT ${catCols} FROM categories ORDER BY sort_order ASC, name ASC`,
      );
      return Promise.all(cats.map(async (cat) => {
        const subs = await query(
          `SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.category_id = :id ORDER BY s.sort_order ASC, s.name ASC`,
          { id: cat.id },
        );
        cat.subcategories = await Promise.all(
          subs.map(async (sub) => {
            sub.subsubcategories = await query(
              `SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.subcategory_id = :subId ORDER BY ss.sort_order ASC, ss.name ASC`,
              { subId: sub.id },
            );
            return sub;
          }),
        );
        return cat;
      }));
    },

    create: async ({ id, name, slug, description = null, image = null, sortOrder = 0 }) => {
      await query(
        `INSERT INTO categories (id, name, slug, description, image, sort_order)
         VALUES (:id, :name, :slug, :description, :image, :sortOrder)`,
        { id, name, slug, description, image, sortOrder },
      );
      return findOne(`SELECT ${catCols} FROM categories WHERE id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        name: 'name', slug: 'slug', description: 'description',
        image: 'image', isActive: 'is_active', sortOrder: 'sort_order',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${catCols} FROM categories WHERE id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE categories SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${catCols} FROM categories WHERE id = :id`, { id });
    },

    delete: (id) => query('DELETE FROM categories WHERE id = :id', { id }),
  });

  // -------------------------------------------------------------------------
  // subcategories  (level 2)  — FK → categories.id
  // -------------------------------------------------------------------------
  const subcategories = Object.freeze({
    findAll: async ({ categoryId, isActive, search, q, sortBy = 'name', sortDir = 'asc', page = 1, limit = 10 } = {}) => {
      const searchTerm = (search ?? q ?? '').trim();
      const conditions = [];
      const vals = {};
      if (categoryId !== undefined) { conditions.push('s.category_id = :categoryId'); vals.categoryId = categoryId; }
      if (isActive !== undefined) { conditions.push('s.is_active = :isActive'); vals.isActive = isActive ? 1 : 0; }
      if (searchTerm) {
        conditions.push('(LOWER(s.name) LIKE :search OR LOWER(s.slug) LIKE :search OR LOWER(s.description) LIKE :search OR LOWER(c.name) LIKE :search)');
        vals.search = `%${searchTerm.toLowerCase()}%`;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const totalRow = await findOne(`SELECT COUNT(*) AS total FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id ${where}`, vals);
      const total = Number(totalRow?.total || 0);
      const offset = (safePage - 1) * safeLimit;
      const rows = await query(
        `SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id ${where} ORDER BY ${buildSortClause('s', sortBy, sortDir)}, s.name ASC LIMIT :limit OFFSET :offset`,
        { ...vals, limit: safeLimit, offset },
      );
      return buildListResult(rows, total, safePage, safeLimit, sortBy, sortDir);
    },

    findById: (id) =>
      findOne(`SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = :id`, { id }),

    findBySlug: (slug) =>
      findOne(`SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.slug = :slug`, { slug }),

    existsBySlug: async (slug, excludeId = null) => {
      const row = await findOne('SELECT id FROM subcategories WHERE slug = :slug', { slug });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    /** Subcategory + its subsubcategories */
    findByIdWithChildren: async (id) => {
      const sub = await findOne(
        `SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = :id`, { id },
      );
      if (!sub) return null;
      sub.subsubcategories = await query(
        `SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.subcategory_id = :id ORDER BY ss.sort_order ASC, ss.name ASC`,
        { id },
      );
      return sub;
    },

    create: async ({ id, categoryId, name, slug, description = null, image = null, sortOrder = 0 }) => {
      await query(
        `INSERT INTO subcategories (id, category_id, name, slug, description, image, sort_order)
         VALUES (:id, :categoryId, :name, :slug, :description, :image, :sortOrder)`,
        { id, categoryId, name, slug, description, image, sortOrder },
      );
      return findOne(`SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        name: 'name', slug: 'slug', description: 'description',
        image: 'image', isActive: 'is_active', sortOrder: 'sort_order',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE subcategories SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${subCatCols} FROM subcategories s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = :id`, { id });
    },

    delete: (id) => query('DELETE FROM subcategories WHERE id = :id', { id }),
  });

  // -------------------------------------------------------------------------
  // subsubcategories  (level 3)  — FK → subcategories.id
  // -------------------------------------------------------------------------
  const subsubcategories = Object.freeze({
    findAll: async ({ subcategoryId, isActive, search, q, sortBy = 'name', sortDir = 'asc', page = 1, limit = 10 } = {}) => {
      const searchTerm = (search ?? q ?? '').trim();
      const conditions = [];
      const vals = {};
      if (subcategoryId !== undefined) { conditions.push('ss.subcategory_id = :subcategoryId'); vals.subcategoryId = subcategoryId; }
      if (isActive !== undefined) { conditions.push('ss.is_active = :isActive'); vals.isActive = isActive ? 1 : 0; }
      if (searchTerm) {
        conditions.push('(LOWER(ss.name) LIKE :search OR LOWER(ss.slug) LIKE :search OR LOWER(ss.description) LIKE :search OR LOWER(sc.name) LIKE :search OR LOWER(c.name) LIKE :search)');
        vals.search = `%${searchTerm.toLowerCase()}%`;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
      const totalRow = await findOne(`SELECT COUNT(*) AS total FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id ${where}`, vals);
      const total = Number(totalRow?.total || 0);
      const offset = (safePage - 1) * safeLimit;
      const rows = await query(
        `SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id ${where} ORDER BY ${buildSortClause('ss', sortBy, sortDir)}, ss.name ASC LIMIT :limit OFFSET :offset`,
        { ...vals, limit: safeLimit, offset },
      );
      return buildListResult(rows, total, safePage, safeLimit, sortBy, sortDir);
    },

    findById: (id) =>
      findOne(`SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.id = :id`, { id }),

    findBySlug: (slug) =>
      findOne(`SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.slug = :slug`, { slug }),

    existsBySlug: async (slug, excludeId = null) => {
      const row = await findOne('SELECT id FROM subsubcategories WHERE slug = :slug', { slug });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    create: async ({ id, subcategoryId, name, slug, description = null, image = null, sortOrder = 0 }) => {
      await query(
        `INSERT INTO subsubcategories (id, subcategory_id, name, slug, description, image, sort_order)
         VALUES (:id, :subcategoryId, :name, :slug, :description, :image, :sortOrder)`,
        { id, subcategoryId, name, slug, description, image, sortOrder },
      );
      return findOne(`SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        name: 'name', slug: 'slug', description: 'description',
        image: 'image', isActive: 'is_active', sortOrder: 'sort_order',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE subsubcategories SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${subSubCatCols} FROM subsubcategories ss LEFT JOIN subcategories sc ON sc.id = ss.subcategory_id LEFT JOIN categories c ON c.id = sc.category_id WHERE ss.id = :id`, { id });
    },

    delete: (id) => query('DELETE FROM subsubcategories WHERE id = :id', { id }),
  });

  const products = Object.freeze({
    findAll: async ({ active, featured, category, subcategory, subsubcategory } = {}) => {
      const conditions = [];
      const vals = {};
      if (active !== undefined) { conditions.push('active = :active'); vals.active = active ? 1 : 0; }
      if (featured !== undefined) { conditions.push('featured = :featured'); vals.featured = featured ? 1 : 0; }
      if (category) {
        conditions.push(`(
          LOWER(category) = LOWER(:category) OR
          LOWER(category) = LOWER(:categoryName) OR
          LOWER(REPLACE(category, ' ', '-')) = LOWER(:categorySlug)
        )`);
        vals.category = category;
        vals.categoryName = category;
        vals.categorySlug = category;
      }
      if (subcategory) {
        conditions.push(`(
          LOWER(subcategory) = LOWER(:subcategory) OR
          LOWER(subcategory) = LOWER(:subcategoryName) OR
          LOWER(REPLACE(subcategory, ' ', '-')) = LOWER(:subcategorySlug)
        )`);
        vals.subcategory = subcategory;
        vals.subcategoryName = subcategory;
        vals.subcategorySlug = subcategory;
      }
      if (subsubcategory) {
        conditions.push(`(
          LOWER(subsubcategory) = LOWER(:subsubcategory) OR
          LOWER(subsubcategory) = LOWER(:subsubcategoryName) OR
          LOWER(REPLACE(subsubcategory, ' ', '-')) = LOWER(:subsubcategorySlug)
        )`);
        vals.subsubcategory = subsubcategory;
        vals.subsubcategoryName = subsubcategory;
        vals.subsubcategorySlug = subsubcategory;
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await query(`SELECT ${productCols} FROM products ${where} ORDER BY created_at DESC`, vals);
      return rows.map((row) => ({
        ...row,
        tags: parseJsonField(row.tags, []),
        colors: parseJsonField(row.colors, []),
        sizes: parseJsonField(row.sizes, []),
        images: parseJsonField(row.images, []),
        specifications: parseJsonField(row.specifications, []),
        features: parseJsonField(row.features, []),
        variants: parseJsonField(row.variants, []),
        attributes: parseJsonField(row.attributes, {}),
        customization: parseJsonField(row.customization, {}),
        seo: parseJsonField(row.seo, {}),
      }));
    },

    findById: async (id) => {
      const row = await findOne(`SELECT ${productCols} FROM products WHERE id = :id`, { id });
      if (!row) return null;
      return {
        ...row,
        tags: parseJsonField(row.tags, []),
        colors: parseJsonField(row.colors, []),
        sizes: parseJsonField(row.sizes, []),
        images: parseJsonField(row.images, []),
        specifications: parseJsonField(row.specifications, []),
        features: parseJsonField(row.features, []),
        variants: parseJsonField(row.variants, []),
        attributes: parseJsonField(row.attributes, {}),
        customization: parseJsonField(row.customization, {}),
        seo: parseJsonField(row.seo, {}),
      };
    },

    findBySlug: async (slug) => {
      const row = await findOne(`SELECT ${productCols} FROM products WHERE slug = :slug`, { slug });
      if (!row) return null;
      return {
        ...row,
        tags: parseJsonField(row.tags, []),
        colors: parseJsonField(row.colors, []),
        sizes: parseJsonField(row.sizes, []),
        images: parseJsonField(row.images, []),
        specifications: parseJsonField(row.specifications, []),
        features: parseJsonField(row.features, []),
        variants: parseJsonField(row.variants, []),
        attributes: parseJsonField(row.attributes, {}),
        customization: parseJsonField(row.customization, {}),
        seo: parseJsonField(row.seo, {}),
      };
    },

    existsBySlug: async (slug, excludeId = null) => {
      const row = await findOne('SELECT id FROM products WHERE slug = :slug', { slug });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    create: async (data) => {
      const payload = {
        ...data,
        sku: data.sku ?? null,
        subsubcategory: data.subsubcategory ?? null,
        brand: data.brand ?? null,
        shortDescription: data.shortDescription ?? null,
        type: data.type ?? null,
        status: data.status ?? 'Draft',
        thumbnail: data.thumbnail ?? data.image ?? null,
        costPrice: data.costPrice ?? null,
        taxCategory: data.taxCategory ?? null,
        minOrderQty: data.minOrderQty ?? 1,
        stockManaged: data.stockManaged ?? true,
        backorder: data.backorder ?? false,
        availability: data.availability ?? null,
        shippingWeight: data.shippingWeight ?? null,
        dimensions: data.dimensions ?? null,
        bulkPricing: data.bulkPricing ?? null,
        quantityDiscount: data.quantityDiscount ?? null,
        couponEligible: data.couponEligible ?? false,
        tags: JSON.stringify(data.tags ?? []),
        colors: JSON.stringify(data.colors ?? []),
        sizes: JSON.stringify(data.sizes ?? []),
        images: JSON.stringify(data.images ?? []),
        specifications: JSON.stringify(data.specifications ?? []),
        features: JSON.stringify(data.features ?? []),
        variants: JSON.stringify(data.variants ?? []),
        attributes: JSON.stringify(data.attributes ?? {}),
        customization: JSON.stringify(data.customization ?? {}),
        seo: JSON.stringify(data.seo ?? {}),
      };
      await query(`
        INSERT INTO products (
          id, sku, category, subcategory, subsubcategory, name, slug, brand, short_description, description, type, status,
          image, thumbnail, price, compare_at_price, cost_price, tax_category, min_order_qty, stock_managed,
          stock, backorder, availability, shipping_weight, dimensions, bulk_pricing, quantity_discount,
          coupon_eligible, active, featured, tags, colors, sizes, images, specifications, features, variants,
          attributes, customization, seo
        ) VALUES (
          :id, :sku, :category, :subcategory, :subsubcategory, :name, :slug, :brand, :shortDescription, :description, :type, :status,
          :image, :thumbnail, :price, :compareAtPrice, :costPrice, :taxCategory, :minOrderQty, :stockManaged,
          :stock, :backorder, :availability, :shippingWeight, :dimensions, :bulkPricing, :quantityDiscount,
          :couponEligible, :active, :featured, :tags, :colors, :sizes, :images, :specifications, :features, :variants,
          :attributes, :customization, :seo
        )`,
      payload);
      return products.findById(data.id);
    },

    update: async (id, fields) => {
      const columnMap = {
        sku: 'sku',
        category: 'category',
        subcategory: 'subcategory',
        subsubcategory: 'subsubcategory',
        name: 'name',
        slug: 'slug',
        brand: 'brand',
        shortDescription: 'short_description',
        description: 'description',
        type: 'type',
        status: 'status',
        image: 'image',
        thumbnail: 'thumbnail',
        price: 'price',
        compareAtPrice: 'compare_at_price',
        costPrice: 'cost_price',
        taxCategory: 'tax_category',
        minOrderQty: 'min_order_qty',
        stockManaged: 'stock_managed',
        stock: 'stock',
        backorder: 'backorder',
        availability: 'availability',
        shippingWeight: 'shipping_weight',
        dimensions: 'dimensions',
        bulkPricing: 'bulk_pricing',
        quantityDiscount: 'quantity_discount',
        couponEligible: 'coupon_eligible',
        active: 'active',
        featured: 'featured',
        tags: 'tags',
        colors: 'colors',
        sizes: 'sizes',
        images: 'images',
        specifications: 'specifications',
        features: 'features',
        variants: 'variants',
        attributes: 'attributes',
        customization: 'customization',
        seo: 'seo',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return products.findById(id);
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      const payload = { id, ...Object.fromEntries(valid) };
      if (payload.tags) payload.tags = JSON.stringify(payload.tags);
      if (payload.colors) payload.colors = JSON.stringify(payload.colors);
      if (payload.sizes) payload.sizes = JSON.stringify(payload.sizes);
      if (payload.images) payload.images = JSON.stringify(payload.images);
      if (payload.specifications) payload.specifications = JSON.stringify(payload.specifications);
      if (payload.features) payload.features = JSON.stringify(payload.features);
      if (payload.variants) payload.variants = JSON.stringify(payload.variants);
      if (payload.attributes) payload.attributes = JSON.stringify(payload.attributes);
      if (payload.customization) payload.customization = JSON.stringify(payload.customization);
      if (payload.seo) payload.seo = JSON.stringify(payload.seo);
      await query(`UPDATE products SET ${assignments} WHERE id = :id`, payload);
      return products.findById(id);
    },

    delete: (id) => query('DELETE FROM products WHERE id = :id', { id }),
  });

  const orders = Object.freeze({
    findAll: async ({ status, orderType, productId, q, page = 1, limit = 20 } = {}) => {
      const conditions = [];
      const vals = {};

      if (status) { conditions.push('status = :status'); vals.status = status; }
      if (orderType) { conditions.push('order_type = :orderType'); vals.orderType = orderType; }
      if (productId) { conditions.push('product_id = :productId'); vals.productId = productId; }
      if (q) {
        conditions.push('(LOWER(product_name) LIKE :search OR LOWER(color) LIKE :search OR LOWER(size) LIKE :search OR LOWER(customer_name) LIKE :search)');
        vals.search = `%${String(q).toLowerCase()}%`;
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const totalRow = await findOne(`SELECT COUNT(*) AS total FROM orders ${where}`, vals);
      const total = Number(totalRow?.total || 0);
      const offset = (safePage - 1) * safeLimit;
      const rows = await query(
        `SELECT ${orderCols} FROM orders ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
        { ...vals, limit: safeLimit, offset },
      );

      return {
        items: rows.map((row) => ({
          ...row,
          customization: parseJsonField(row.customization, {}),
        })),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil((total || 1) / safeLimit)),
      };
    },

    findById: async (id) => {
      const row = await findOne(`SELECT ${orderCols} FROM orders WHERE id = :id`, { id });
      if (!row) return null;
      return { ...row, customization: parseJsonField(row.customization, {}) };
    },

    create: async (data) => {
      const payload = {
        ...data,
        quantity: Number(data.quantity ?? 1),
        orderType: data.orderType ?? 'plain',
        quantityMode: data.quantityMode ?? 'single',
        unitPrice: Number(data.unitPrice ?? 0),
        totalPrice: Number(data.totalPrice ?? (Number(data.unitPrice ?? 0) * Number(data.quantity ?? 1))),
        status: data.status ?? 'pending',
        source: data.source ?? 'frontend',
        customization: JSON.stringify(data.customization ?? {}),
      };

      await query(`
        INSERT INTO orders (
          id, product_id, product_name, slug, category, subcategory, color, size, quantity,
          order_type, quantity_mode, unit_price, total_price, status, source, customer_name,
          phone, customization, notes
        ) VALUES (
          :id, :productId, :productName, :slug, :category, :subcategory, :color, :size, :quantity,
          :orderType, :quantityMode, :unitPrice, :totalPrice, :status, :source, :customerName,
          :phone, :customization, :notes
        )`, payload);
      return orders.findById(data.id);
    },

    update: async (id, fields) => {
      const columnMap = {
        productId: 'product_id',
        productName: 'product_name',
        slug: 'slug',
        category: 'category',
        subcategory: 'subcategory',
        color: 'color',
        size: 'size',
        quantity: 'quantity',
        orderType: 'order_type',
        quantityMode: 'quantity_mode',
        unitPrice: 'unit_price',
        totalPrice: 'total_price',
        status: 'status',
        source: 'source',
        customerName: 'customer_name',
        phone: 'phone',
        customization: 'customization',
        notes: 'notes',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return orders.findById(id);
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      const payload = { id, ...Object.fromEntries(valid) };
      if (payload.customization) payload.customization = JSON.stringify(payload.customization);
      await query(`UPDATE orders SET ${assignments} WHERE id = :id`, payload);
      return orders.findById(id);
    },

    delete: (id) => query('DELETE FROM orders WHERE id = :id', { id }),
  });

  // -------------------------------------------------------------------------
  return Object.freeze({
    client: 'mysql',
    checkConnection: () => query('SELECT 1'),
    migrate,
    users,
    categories,
    subcategories,
    subsubcategories,
    products,
    orders,
    close: () => pool.end(),
  });
};
