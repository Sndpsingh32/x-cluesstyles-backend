import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const phoneArg = process.argv[2]?.trim() || '9876543210';

const adminProfile = {
  fullName:    process.env.ADMIN_NAME        || 'Sandeep Singh',
  email:       process.env.ADMIN_EMAIL       || 'admin@xcluesstyles.com',
  avatar:      process.env.ADMIN_AVATAR      || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  addressLine: process.env.ADMIN_ADDRESS     || 'Plot 42, Xcluesstyles Main Street, Sector 2',
  city:        process.env.ADMIN_CITY        || 'New Delhi',
  state:       process.env.ADMIN_STATE       || 'Delhi',
  pincode:     process.env.ADMIN_PINCODE     || '110001',
  country:     process.env.ADMIN_COUNTRY     || 'India',
  role:        'admin',
};

const run = async () => {
  const conn = await mysql.createConnection({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
  });

  try {
    if (process.argv[2] === '--list') {
      const [admins] = await conn.query(
        `SELECT id, phone, full_name AS fullName, email, avatar, 
                address_line AS addressLine, city, state, pincode, country, 
                role, created_at AS createdAt 
         FROM users WHERE role = 'admin'`
      );
      console.log('--- Current Admins in MySQL ---');
      console.table(admins);
      return;
    }

    const [existing] = await conn.query('SELECT * FROM users WHERE phone = ?', [phoneArg]);

    if (existing.length > 0) {
      // Update all profile fields for existing user
      await conn.query(
        `UPDATE users SET 
           role = 'admin',
           full_name = ?,
           email = ?,
           avatar = ?,
           address_line = ?,
           city = ?,
           state = ?,
           pincode = ?,
           country = ?
         WHERE phone = ?`,
        [
          adminProfile.fullName,
          adminProfile.email,
          adminProfile.avatar,
          adminProfile.addressLine,
          adminProfile.city,
          adminProfile.state,
          adminProfile.pincode,
          adminProfile.country,
          phoneArg,
        ]
      );
      console.log(`\n✅ Success! User with phone ${phoneArg} is now ADMIN with all profile fields populated.`);
    } else {
      const id = randomUUID();
      await conn.query(
        `INSERT INTO users (
           id, phone, full_name, email, avatar, 
           address_line, city, state, pincode, country, role
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`,
        [
          id,
          phoneArg,
          adminProfile.fullName,
          adminProfile.email,
          adminProfile.avatar,
          adminProfile.addressLine,
          adminProfile.city,
          adminProfile.state,
          adminProfile.pincode,
          adminProfile.country,
        ]
      );
      console.log(`\n✅ Success! Created new ADMIN user with phone ${phoneArg} (ID: ${id}) with full profile.`);
    }

    const [updated] = await conn.query(
      `SELECT id, phone, full_name AS fullName, email, avatar, 
              address_line AS addressLine, city, state, pincode, country, 
              role, updated_at AS updatedAt 
       FROM users WHERE phone = ?`,
      [phoneArg]
    );

    console.log('\n--- Admin Details in MySQL ---');
    console.table(updated);
  } finally {
    await conn.end();
  }
};

run().catch((err) => {
  console.error('Error setting admin:', err.message);
  process.exit(1);
});
