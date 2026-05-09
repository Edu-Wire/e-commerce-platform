import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Real Unsplash image URLs per category
const images = {
  electronics: [
    'https://images.unsplash.com/photo-1546868871-70c122469d8b?w=800', // Smartwatch
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', // Watch
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', // Phone
    'https://images.unsplash.com/photo-1525547718571-039422e5a1b3?w=800', // Laptop
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', // Headphones
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', // Audio
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', // Laptop 2
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800', // Tech
  ],
  clothing: [
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800', // Chinos/Pants
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', // T-shirt
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', // Jeans
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', // Dress
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', // Black Tee
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800', // Polo
  ],
  footwear: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', // Nike
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800', // Sneakers
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', // Green Nike
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', // Leather shoes
  ],
  accessories: [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', // Bag/Tote
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', // Backpack
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', // Handbag
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', // Sunglasses
    'https://images.unsplash.com/photo-1627140614005-7057a2366824?w=800', // Travel bag
  ],
  home: [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800', // Kitchen
    'https://images.unsplash.com/photo-1584946197175-052ffac3fc8a?w=800', // Cookware
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', // Sofa
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Furniture
  ],
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getImages(cat: keyof typeof images, count = 3): { url: string; is_primary: boolean; sort_order: number; id: number }[] {
  const arr = images[cat];
  return Array.from({ length: count }, (_, i) => ({
    url: arr[i % arr.length],
    is_primary: i === 0,
    sort_order: i,
    id: i + 1
  }));
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding admin...');
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const adminRes = await client.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Admin Owner', 'admin@retail.com', adminHash, 'owner']
    );
    const adminId = adminRes.rows[0].id;

    console.log('Seeding categories...');
    const catRows = await client.query(
      `INSERT INTO categories (name, slug, parent_id, is_active) VALUES
         ('Electronics',   'electronics',   NULL, true),
         ('Clothing',      'clothing',      NULL, true),
         ('Footwear',      'footwear',      NULL, true),
         ('Accessories',   'accessories',   NULL, true),
         ('Home & Kitchen','home-kitchen',  NULL, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`
    );
    const catMap: Record<string, number> = {};
    for (const r of catRows.rows) catMap[r.slug] = r.id;

    const subRows = await client.query(
      `INSERT INTO categories (name, slug, parent_id, is_active) VALUES
         ('Men''s Wear',  'mens-wear',   $1, true),
         ('Women''s Wear','womens-wear', $1, true),
         ('Kids'' Wear',  'kids-wear',   $1, true),
         ('Smartphones',  'smartphones', $2, true),
         ('Laptops',      'laptops',     $2, true),
         ('Audio',        'audio',       $2, true),
         ('Cameras',      'cameras',     $2, true),
         ('Sneakers',     'sneakers',    $3, true),
         ('Formal Shoes', 'formal-shoes',$3, true),
         ('Sandals',      'sandals',     $3, true),
         ('Watches',      'watches',     $4, true),
         ('Bags',         'bags',        $4, true),
         ('Sunglasses',   'sunglasses',  $4, true),
         ('Kitchen',      'kitchen',     $5, true),
         ('Furniture',    'furniture',   $5, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`,
      [catMap['clothing'], catMap['electronics'], catMap['footwear'], catMap['accessories'], catMap['home-kitchen']]
    );
    for (const r of subRows.rows) catMap[r.slug] = r.id;

    console.log('Seeding 100 products...');
    const statuses = ['new', 'new', 'new', 'new_with_minor_damage', 'new_with_defect'];

    const products = [
      // ── SMARTPHONES ──────────────────────────────────────────────────
      { cat: 'smartphones', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', mrp: 134999, bp: 100000, sp: 114999, b2b: 108000, imgs: getImages('electronics'), specs: { storage: '256GB', ram: '12GB', camera: '200MP' }, tags: ['smartphone', 'samsung', '5g'] },
      { cat: 'smartphones', name: 'Apple iPhone 15 Pro Max', brand: 'Apple', mrp: 159900, bp: 125000, sp: 144999, b2b: 138000, imgs: getImages('electronics'), specs: { storage: '256GB', chip: 'A17 Pro', camera: '48MP' }, tags: ['iphone', 'apple', '5g'] },
      { cat: 'smartphones', name: 'OnePlus 12 5G', brand: 'OnePlus', mrp: 64999, bp: 46000, sp: 57999, b2b: 54000, imgs: getImages('electronics'), specs: { storage: '256GB', ram: '16GB', battery: '5400mAh' }, tags: ['oneplus', '5g', 'flagship'] },
      { cat: 'smartphones', name: 'Google Pixel 8 Pro', brand: 'Google', mrp: 106999, bp: 80000, sp: 94999, b2b: 89000, imgs: getImages('electronics'), specs: { storage: '128GB', camera: '50MP', ai: 'Google AI' }, tags: ['pixel', 'google', 'android'] },
      
      // ── LAPTOPS ──────────────────────────────────────────────────────
      { cat: 'laptops', name: 'Apple MacBook Pro 14 M3', brand: 'Apple', mrp: 199900, bp: 158000, sp: 182999, b2b: 174000, imgs: getImages('electronics'), specs: { chip: 'M3 Pro', ram: '18GB', ssd: '512GB' }, tags: ['macbook', 'apple', 'm3'] },
      { cat: 'laptops', name: 'Dell XPS 15 OLED', brand: 'Dell', mrp: 189990, bp: 145000, sp: 169999, b2b: 160000, imgs: getImages('electronics'), specs: { cpu: 'Intel i7-13700H', ram: '32GB', display: '15.6 OLED' }, tags: ['dell', 'xps', 'oled'] },
      
      // ── AUDIO ────────────────────────────────────────────────────────
      { cat: 'audio', name: 'Sony WH-1000XM5', brand: 'Sony', mrp: 29990, bp: 18000, sp: 24999, b2b: 22000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', battery: '30hr' }, tags: ['sony', 'headphones', 'anc'] },
      { cat: 'audio', name: 'Bose QuietComfort 45', brand: 'Bose', mrp: 32990, bp: 20000, sp: 27999, b2b: 25000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', battery: '24hr' }, tags: ['bose', 'headphones', 'anc'] },
      
      // ── CLOTHING ─────────────────────────────────────────────────────
      { cat: 'mens-wear', name: 'Levi\'s 511 Slim Fit Jeans', brand: 'Levi\'s', mrp: 3999, bp: 1400, sp: 2999, b2b: 2600, imgs: getImages('clothing'), specs: { fit: 'Slim', material: 'Denim' }, tags: ['jeans', 'men', 'levis'] },
      { cat: 'mens-wear', name: 'H&M Slim Chino Pants', brand: 'H&M', mrp: 2999, bp: 900, sp: 1999, b2b: 1700, imgs: getImages('clothing'), specs: { fit: 'Slim', material: 'Cotton Blend' }, tags: ['chinos', 'men', 'casual'] },
      { cat: 'womens-wear', name: 'Marks & Spencer Jumpsuit', brand: 'M&S', mrp: 5499, bp: 1800, sp: 3999, b2b: 3500, imgs: getImages('clothing'), specs: { material: 'Jersey', fit: 'Wide Leg' }, tags: ['jumpsuit', 'women', 'casual'] },
      { cat: 'womens-wear', name: 'Vero Moda Trench Coat', brand: 'Vero Moda', mrp: 7999, bp: 2800, sp: 5799, b2b: 5200, imgs: getImages('clothing'), specs: { material: 'Polyester', length: 'Long' }, tags: ['coat', 'women', 'winter'] },

      // ── FOOTWEAR ─────────────────────────────────────────────────────
      { cat: 'sneakers', name: 'Nike Air Max 270', brand: 'Nike', mrp: 11995, bp: 5500, sp: 8999, b2b: 8000, imgs: getImages('footwear'), specs: { sole: 'Air Max' }, tags: ['sneakers', 'nike'] },
      { cat: 'sneakers', name: 'New Balance 574 Core', brand: 'New Balance', mrp: 8999, bp: 4000, sp: 6999, b2b: 6200, imgs: getImages('footwear'), specs: { sole: 'ENCAP' }, tags: ['sneakers', 'newbalance'] },

      // ── ACCESSORIES ──────────────────────────────────────────────────
      { cat: 'watches', name: 'Samsung Galaxy Watch 6', brand: 'Samsung', mrp: 29999, bp: 22000, sp: 26999, b2b: 25000, imgs: getImages('electronics'), specs: { os: 'Wear OS' }, tags: ['smartwatch', 'samsung'] },
      { cat: 'bags', name: 'American Tourister Trolley Bag', brand: 'American Tourister', mrp: 8999, bp: 4000, sp: 6799, b2b: 6200, imgs: getImages('accessories'), specs: { capacity: '68L' }, tags: ['luggage', 'travel'] },
      { cat: 'bags', name: 'Lavie Women Tote Bag', brand: 'Lavie', mrp: 3499, bp: 1200, sp: 2299, b2b: 1900, imgs: getImages('accessories'), specs: { material: 'PU Leather' }, tags: ['tote', 'women'] },
      
      // ── HOME ─────────────────────────────────────────────────────────
      { cat: 'kitchen', name: 'Philips Air Fryer HD9252', brand: 'Philips', mrp: 11995, bp: 6500, sp: 8999, b2b: 8200, imgs: getImages('home'), specs: { capacity: '4.1L' }, tags: ['airfryer', 'philips'] },
      { cat: 'furniture', name: 'IKEA KALLAX Shelf Unit', brand: 'IKEA', mrp: 14999, bp: 8000, sp: 11999, b2b: 10800, imgs: getImages('home'), specs: { material: 'Particleboard' }, tags: ['shelf', 'ikea'] },
    ];

    const slugCount: Record<string, number> = {};
    let inserted = 0;

    for (const p of products) {
      const catId = catMap[p.cat];
      if (!catId) continue;

      const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      slugCount[baseSlug] = (slugCount[baseSlug] || 0) + 1;
      const slug = slugCount[baseSlug] > 1 ? `${baseSlug}-${slugCount[baseSlug]}` : baseSlug;
      const sku = `${p.cat.toUpperCase().slice(0,3)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

      const cond = pick(statuses);
      const stock = rand(5, 120);

      await client.query(
        `INSERT INTO products (
           category_id, name, slug, description, sku, brand,
           mrp, buying_price, selling_price,
           condition, stock_quantity, minimum_stock_alert,
           is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
           images, specifications, weight_grams, tags,
           is_active, is_featured, created_by
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14,$15,$16,$17,$18,$19,true,$20,$21
         ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        [
          catId, p.name, slug, `${p.name} — premium product by ${p.brand}.`,
          sku, p.brand, p.mrp, p.bp, p.sp, cond, stock, 5,
          true, p.b2b, rand(2, 5), JSON.stringify(p.imgs),
          JSON.stringify(p.specs), rand(500, 5000), p.tags, Math.random() < 0.3, adminId
        ]
      );
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`🎉 Seeded ${inserted} products successfully!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
