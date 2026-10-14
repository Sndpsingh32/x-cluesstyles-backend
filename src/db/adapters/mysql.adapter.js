import mysql from 'mysql2/promise';

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
    role, created_at AS createdAt, updated_at AS updatedAt
  `;

  const catCols = `
    id, name, slug, description, image,
    is_active AS isActive, sort_order AS sortOrder,
    created_at AS createdAt, updated_at AS updatedAt
  `;

  const subCatCols = `
    id, category_id AS categoryId, name, slug, description, image,
    is_active AS isActive, sort_order AS sortOrder,
    created_at AS createdAt, updated_at AS updatedAt
  `;

  const subSubCatCols = `
    id, subcategory_id AS subcategoryId, name, slug, description, image,
    is_active AS isActive, sort_order AS sortOrder,
    created_at AS createdAt, updated_at AS updatedAt
  `;

  // -------------------------------------------------------------------------
  // Migration — creates all 4 tables
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
        image       VARCHAR(2048) NULL,
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
        image         VARCHAR(2048) NULL,
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
        image            VARCHAR(2048) NULL,
        is_active        TINYINT(1)    NOT NULL DEFAULT 1,
        sort_order       INT           NOT NULL DEFAULT 0,
        created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_subsub_subcategory
          FOREIGN KEY (subcategory_id) REFERENCES subcategories (id)
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  };

  // -------------------------------------------------------------------------
  // users
  // -------------------------------------------------------------------------
  const users = Object.freeze({
    findById: (id) =>
      findOne(`SELECT ${userCols} FROM users WHERE id = :id`, { id }),

    findByPhone: (phone) =>
      findOne(`SELECT ${userCols} FROM users WHERE phone = :phone`, { phone }),

    findByEmail: (email) =>
      findOne(`SELECT ${userCols} FROM users WHERE email = :email`, { email }),

    existsByPhone: async (phone) =>
      !!(await findOne('SELECT id FROM users WHERE phone = :phone', { phone })),

    existsByEmail: async (email, excludeId = null) => {
      const row = await findOne('SELECT id FROM users WHERE email = :email', { email });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    create: async ({ id, phone, role = 'user' }) => {
      await query(
        'INSERT INTO users (id, phone, role) VALUES (:id, :phone, :role)',
        { id, phone, role },
      );
      return findOne(`SELECT ${userCols} FROM users WHERE id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        fullName: 'full_name', email: 'email', avatar: 'avatar',
        addressLine: 'address_line', city: 'city', state: 'state',
        pincode: 'pincode', country: 'country',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${userCols} FROM users WHERE id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE users SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${userCols} FROM users WHERE id = :id`, { id });
    },
  });

  // -------------------------------------------------------------------------
  // categories  (level 1)
  // -------------------------------------------------------------------------
  const categories = Object.freeze({
    findAll: ({ isActive } = {}) => {
      const where = isActive !== undefined ? 'WHERE is_active = :isActive' : '';
      const vals  = isActive !== undefined ? { isActive: isActive ? 1 : 0 } : {};
      return query(
        `SELECT ${catCols} FROM categories ${where} ORDER BY sort_order ASC, name ASC`,
        vals,
      );
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
        `SELECT ${subCatCols} FROM subcategories WHERE category_id = :id ORDER BY sort_order ASC, name ASC`,
        { id },
      );

      category.subcategories = await Promise.all(
        subs.map(async (sub) => {
          sub.subsubcategories = await query(
            `SELECT ${subSubCatCols} FROM subsubcategories WHERE subcategory_id = :subId ORDER BY sort_order ASC, name ASC`,
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
          `SELECT ${subCatCols} FROM subcategories WHERE category_id = :id ORDER BY sort_order ASC, name ASC`,
          { id: cat.id },
        );
        cat.subcategories = await Promise.all(
          subs.map(async (sub) => {
            sub.subsubcategories = await query(
              `SELECT ${subSubCatCols} FROM subsubcategories WHERE subcategory_id = :subId ORDER BY sort_order ASC, name ASC`,
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
    findAll: ({ categoryId, isActive } = {}) => {
      const conditions = [];
      const vals = {};
      if (categoryId !== undefined) { conditions.push('category_id = :categoryId'); vals.categoryId = categoryId; }
      if (isActive   !== undefined) { conditions.push('is_active = :isActive');     vals.isActive   = isActive ? 1 : 0; }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      return query(
        `SELECT ${subCatCols} FROM subcategories ${where} ORDER BY sort_order ASC, name ASC`,
        vals,
      );
    },

    findById: (id) =>
      findOne(`SELECT ${subCatCols} FROM subcategories WHERE id = :id`, { id }),

    findBySlug: (slug) =>
      findOne(`SELECT ${subCatCols} FROM subcategories WHERE slug = :slug`, { slug }),

    existsBySlug: async (slug, excludeId = null) => {
      const row = await findOne('SELECT id FROM subcategories WHERE slug = :slug', { slug });
      if (!row) return false;
      return excludeId ? row.id !== excludeId : true;
    },

    /** Subcategory + its subsubcategories */
    findByIdWithChildren: async (id) => {
      const sub = await findOne(
        `SELECT ${subCatCols} FROM subcategories WHERE id = :id`, { id },
      );
      if (!sub) return null;
      sub.subsubcategories = await query(
        `SELECT ${subSubCatCols} FROM subsubcategories WHERE subcategory_id = :id ORDER BY sort_order ASC, name ASC`,
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
      return findOne(`SELECT ${subCatCols} FROM subcategories WHERE id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        name: 'name', slug: 'slug', description: 'description',
        image: 'image', isActive: 'is_active', sortOrder: 'sort_order',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${subCatCols} FROM subcategories WHERE id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE subcategories SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${subCatCols} FROM subcategories WHERE id = :id`, { id });
    },

    delete: (id) => query('DELETE FROM subcategories WHERE id = :id', { id }),
  });

  // -------------------------------------------------------------------------
  // subsubcategories  (level 3)  — FK → subcategories.id
  // -------------------------------------------------------------------------
  const subsubcategories = Object.freeze({
    findAll: ({ subcategoryId, isActive } = {}) => {
      const conditions = [];
      const vals = {};
      if (subcategoryId !== undefined) { conditions.push('subcategory_id = :subcategoryId'); vals.subcategoryId = subcategoryId; }
      if (isActive      !== undefined) { conditions.push('is_active = :isActive');            vals.isActive      = isActive ? 1 : 0; }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      return query(
        `SELECT ${subSubCatCols} FROM subsubcategories ${where} ORDER BY sort_order ASC, name ASC`,
        vals,
      );
    },

    findById: (id) =>
      findOne(`SELECT ${subSubCatCols} FROM subsubcategories WHERE id = :id`, { id }),

    findBySlug: (slug) =>
      findOne(`SELECT ${subSubCatCols} FROM subsubcategories WHERE slug = :slug`, { slug }),

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
      return findOne(`SELECT ${subSubCatCols} FROM subsubcategories WHERE id = :id`, { id });
    },

    update: async (id, fields) => {
      const columnMap = {
        name: 'name', slug: 'slug', description: 'description',
        image: 'image', isActive: 'is_active', sortOrder: 'sort_order',
      };
      const valid = Object.entries(fields).filter(([k]) => columnMap[k]);
      if (!valid.length) return findOne(`SELECT ${subSubCatCols} FROM subsubcategories WHERE id = :id`, { id });
      const assignments = valid.map(([k]) => `${columnMap[k]} = :${k}`).join(', ');
      await query(`UPDATE subsubcategories SET ${assignments} WHERE id = :id`, { ...Object.fromEntries(valid), id });
      return findOne(`SELECT ${subSubCatCols} FROM subsubcategories WHERE id = :id`, { id });
    },

    delete: (id) => query('DELETE FROM subsubcategories WHERE id = :id', { id }),
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
    close: () => pool.end(),
  });
};
