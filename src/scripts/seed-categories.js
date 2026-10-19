import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const sampleData = [
  {
    name: 'Men',
    slug: 'men',
    description: 'Men clothing, street style, casual & formal apparel',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80',
    sortOrder: 1,
    subcategories: [
      {
        name: 'T-Shirts',
        slug: 'men-t-shirts',
        description: 'Cotton, oversized, crewneck & graphic tees for men',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        sortOrder: 1,
        subsubcategories: [
          { name: 'Oversized Tees', slug: 'men-oversized-tees', description: 'Relaxed fit heavy cotton drop-shoulder tees', sortOrder: 1 },
          { name: 'Polo T-Shirts',  slug: 'men-polo-t-shirts',  description: 'Classic collared polo tees', sortOrder: 2 },
          { name: 'Graphic Tees',   slug: 'men-graphic-tees',   description: 'Anime, vintage and typography printed tees', sortOrder: 3 },
        ],
      },
      {
        name: 'Shirts',
        slug: 'men-shirts',
        description: 'Casual, flannel, linen & formal button-down shirts',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        sortOrder: 2,
        subsubcategories: [
          { name: 'Casual Shirts', slug: 'men-casual-shirts', description: 'Everyday casual shirts', sortOrder: 1 },
          { name: 'Formal Shirts', slug: 'men-formal-shirts', description: 'Workplace and event shirts', sortOrder: 2 },
        ],
      },
      {
        name: 'Jackets & Hoodies',
        slug: 'men-jackets-hoodies',
        description: 'Winter jackets, fleece pullovers and zip hoodies',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        sortOrder: 3,
        subsubcategories: [
          { name: 'Zip-Up Hoodies',  slug: 'men-zip-hoodies',   description: 'Full zip fleece hoodies', sortOrder: 1 },
          { name: 'Bomber Jackets',  slug: 'men-bomber-jackets', description: 'Classic streetwear bomber jackets', sortOrder: 2 },
        ],
      },
    ],
  },
  {
    name: 'Women',
    slug: 'women',
    description: 'Trendy women apparel, western wear and designer dresses',
    image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=800&q=80',
    sortOrder: 2,
    subcategories: [
      {
        name: 'Dresses',
        slug: 'women-dresses',
        description: 'Casual day dresses, evening wear and cocktail dresses',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
        sortOrder: 1,
        subsubcategories: [
          { name: 'Maxi Dresses',  slug: 'women-maxi-dresses',  description: 'Floor-length flowy dresses', sortOrder: 1 },
          { name: 'Floral Midi',   slug: 'women-floral-midi',   description: 'Elegant floral print midi dresses', sortOrder: 2 },
        ],
      },
      {
        name: 'Tops & Tees',
        slug: 'women-tops-tees',
        description: 'Crop tops, basic tees, shirts and camisoles',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        sortOrder: 2,
        subsubcategories: [
          { name: 'Crop Tops',   slug: 'women-crop-tops',   description: 'Trendy casual crop tops', sortOrder: 1 },
          { name: 'Basic Tees',  slug: 'women-basic-tees',  description: 'Soft cotton essential tees', sortOrder: 2 },
        ],
      },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Fashion caps, bags, belts and everyday lifestyle accessories',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    sortOrder: 3,
    subcategories: [
      {
        name: 'Caps & Beanies',
        slug: 'caps-beanies',
        description: 'Snapbacks, baseball caps and knit beanies',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        sortOrder: 1,
        subsubcategories: [],
      },
      {
        name: 'Bags & Backpacks',
        slug: 'bags-backpacks',
        description: 'Tote bags, canvas backpacks and crossbody sling bags',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        sortOrder: 2,
        subsubcategories: [],
      },
    ],
  },
];

const run = async () => {
  const conn = await mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
  });

  try {
    console.log('Seeding categories, subcategories, and subsubcategories in MySQL...');

    for (const cat of sampleData) {
      const [existingCat] = await conn.query('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
      let catId = existingCat[0]?.id;

      if (!catId) {
        catId = randomUUID();
        await conn.query(
          `INSERT INTO categories (id, name, slug, description, image, is_active, sort_order)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [catId, cat.name, cat.slug, cat.description, cat.image, cat.sortOrder],
        );
        console.log(`+ Category: ${cat.name} (${cat.slug})`);
      } else {
        console.log(`~ Category exists: ${cat.name}`);
      }

      for (const sub of cat.subcategories) {
        const [existingSub] = await conn.query('SELECT id FROM subcategories WHERE slug = ?', [sub.slug]);
        let subId = existingSub[0]?.id;

        if (!subId) {
          subId = randomUUID();
          await conn.query(
            `INSERT INTO subcategories (id, category_id, name, slug, description, image, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            [subId, catId, sub.name, sub.slug, sub.description, sub.image, sub.sortOrder],
          );
          console.log(`  + Subcategory: ${sub.name} (${sub.slug})`);
        } else {
          console.log(`  ~ Subcategory exists: ${sub.name}`);
        }

        for (const subsub of sub.subsubcategories) {
          const [existingSubSub] = await conn.query('SELECT id FROM subsubcategories WHERE slug = ?', [subsub.slug]);
          if (!existingSubSub.length) {
            const subSubId = randomUUID();
            await conn.query(
              `INSERT INTO subsubcategories (id, subcategory_id, name, slug, description, is_active, sort_order)
               VALUES (?, ?, ?, ?, ?, 1, ?)`,
              [subSubId, subId, subsub.name, subsub.slug, subsub.description, subsub.sortOrder],
            );
            console.log(`    + SubSubCategory: ${subsub.name} (${subsub.slug})`);
          }
        }
      }
    }

    const [catCount] = await conn.query('SELECT COUNT(*) as count FROM categories');
    const [subCount] = await conn.query('SELECT COUNT(*) as count FROM subcategories');
    const [subSubCount] = await conn.query('SELECT COUNT(*) as count FROM subsubcategories');

    console.log('\n--- Seeding Complete ---');
    console.log(`Categories:        ${catCount[0].count}`);
    console.log(`Subcategories:     ${subCount[0].count}`);
    console.log(`SubSubcategories:  ${subSubCount[0].count}`);
  } finally {
    await conn.end();
  }
};

run().catch((err) => {
  console.error('Error seeding categories:', err);
  process.exit(1);
});
