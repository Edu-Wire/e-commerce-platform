import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Real Unsplash image URLs per category
const images = {
  electronics: [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600',
    'https://images.unsplash.com/photo-1593640408182-31c228e77b5e?w=600',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    'https://images.unsplash.com/photo-1504707748692-419802426825?w=600',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
    'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=600',
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600',
  ],
  footwear: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600',
    'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600',
  ],
  home: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  ],
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getImages(cat: keyof typeof images, count = 3): string[] {
  const arr = images[cat];
  return Array.from({ length: count }, (_, i) => arr[i % arr.length]);
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Admin ──────────────────────────────────────────────────────────
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

    // ── Categories ─────────────────────────────────────────────────────
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

    // ── Products ───────────────────────────────────────────────────────
    console.log('Seeding 100 products...');

    const conditions = ['new', 'new_with_minor_damage', 'new_with_defect'] as const;
    const statuses   = ['new', 'new', 'new', 'new_with_minor_damage', 'new_with_defect'];

    const products = [
      // ── SMARTPHONES (10) ──────────────────────────────────────────────
      { cat: 'smartphones', name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', mrp: 134999, bp: 100000, sp: 114999, b2b: 108000, imgs: getImages('electronics'), specs: { storage: '256GB', ram: '12GB', camera: '200MP' }, tags: ['smartphone', 'samsung', '5g'] },
      { cat: 'smartphones', name: 'Apple iPhone 15 Pro Max', brand: 'Apple', mrp: 159900, bp: 125000, sp: 144999, b2b: 138000, imgs: getImages('electronics'), specs: { storage: '256GB', chip: 'A17 Pro', camera: '48MP' }, tags: ['iphone', 'apple', '5g'] },
      { cat: 'smartphones', name: 'OnePlus 12 5G', brand: 'OnePlus', mrp: 64999, bp: 46000, sp: 57999, b2b: 54000, imgs: getImages('electronics'), specs: { storage: '256GB', ram: '16GB', battery: '5400mAh' }, tags: ['oneplus', '5g', 'flagship'] },
      { cat: 'smartphones', name: 'Google Pixel 8 Pro', brand: 'Google', mrp: 106999, bp: 80000, sp: 94999, b2b: 89000, imgs: getImages('electronics'), specs: { storage: '128GB', camera: '50MP', ai: 'Google AI' }, tags: ['pixel', 'google', 'android'] },
      { cat: 'smartphones', name: 'Xiaomi 14 Pro', brand: 'Xiaomi', mrp: 89999, bp: 65000, sp: 79999, b2b: 75000, imgs: getImages('electronics'), specs: { storage: '512GB', ram: '16GB', display: '6.73 AMOLED' }, tags: ['xiaomi', '5g', 'camera'] },
      { cat: 'smartphones', name: 'Realme GT 5 Pro', brand: 'Realme', mrp: 49999, bp: 35000, sp: 43999, b2b: 40000, imgs: getImages('electronics'), specs: { storage: '256GB', battery: '5240mAh', charge: '100W' }, tags: ['realme', 'fast-charge', '5g'] },
      { cat: 'smartphones', name: 'Vivo X100 Pro', brand: 'Vivo', mrp: 99999, bp: 74000, sp: 88999, b2b: 83000, imgs: getImages('electronics'), specs: { camera: 'Zeiss 50MP', storage: '256GB', battery: '5400mAh' }, tags: ['vivo', 'zeiss', '5g'] },
      { cat: 'smartphones', name: 'OPPO Find X7 Ultra', brand: 'OPPO', mrp: 99999, bp: 73000, sp: 87999, b2b: 82000, imgs: getImages('electronics'), specs: { storage: '512GB', ram: '16GB', camera: 'Hasselblad' }, tags: ['oppo', 'hasselblad', '5g'] },
      { cat: 'smartphones', name: 'Nothing Phone 2', brand: 'Nothing', mrp: 44999, bp: 32000, sp: 39999, b2b: 37000, imgs: getImages('electronics'), specs: { storage: '256GB', display: 'OLED 120Hz', glyph: 'Interface 2.0' }, tags: ['nothing', 'glyph', '5g'] },
      { cat: 'smartphones', name: 'Motorola Edge 50 Pro', brand: 'Motorola', mrp: 39999, bp: 28000, sp: 34999, b2b: 32000, imgs: getImages('electronics'), specs: { storage: '256GB', battery: '4500mAh', charge: '125W' }, tags: ['motorola', 'fast-charge', '5g'] },

      // ── LAPTOPS (10) ──────────────────────────────────────────────────
      { cat: 'laptops', name: 'Apple MacBook Pro 14 M3', brand: 'Apple', mrp: 199900, bp: 158000, sp: 182999, b2b: 174000, imgs: getImages('electronics'), specs: { chip: 'M3 Pro', ram: '18GB', ssd: '512GB' }, tags: ['macbook', 'apple', 'm3'] },
      { cat: 'laptops', name: 'Dell XPS 15 OLED', brand: 'Dell', mrp: 189990, bp: 145000, sp: 169999, b2b: 160000, imgs: getImages('electronics'), specs: { cpu: 'Intel i7-13700H', ram: '32GB', display: '15.6 OLED' }, tags: ['dell', 'xps', 'oled'] },
      { cat: 'laptops', name: 'Lenovo ThinkPad X1 Carbon', brand: 'Lenovo', mrp: 169990, bp: 128000, sp: 149999, b2b: 140000, imgs: getImages('electronics'), specs: { cpu: 'Intel i7-1365U', ram: '16GB', weight: '1.12kg' }, tags: ['thinkpad', 'lenovo', 'business'] },
      { cat: 'laptops', name: 'ASUS ROG Zephyrus G14', brand: 'ASUS', mrp: 149990, bp: 112000, sp: 132999, b2b: 125000, imgs: getImages('electronics'), specs: { cpu: 'Ryzen 9 7940HS', gpu: 'RTX 4060', ram: '32GB' }, tags: ['asus', 'rog', 'gaming'] },
      { cat: 'laptops', name: 'HP Spectre x360 14', brand: 'HP', mrp: 159990, bp: 120000, sp: 141999, b2b: 133000, imgs: getImages('electronics'), specs: { cpu: 'Intel i7-1355U', display: '14 OLED Touch', ram: '16GB' }, tags: ['hp', 'spectre', '2-in-1'] },
      { cat: 'laptops', name: 'MSI Titan GT77 HX', brand: 'MSI', mrp: 349990, bp: 270000, sp: 314999, b2b: 295000, imgs: getImages('electronics'), specs: { cpu: 'Intel i9-13980HX', gpu: 'RTX 4090', ram: '64GB' }, tags: ['msi', 'gaming', 'titan'] },
      { cat: 'laptops', name: 'Acer Swift Edge 16', brand: 'Acer', mrp: 109990, bp: 82000, sp: 97999, b2b: 91000, imgs: getImages('electronics'), specs: { cpu: 'Ryzen 7 7840U', display: '16 OLED', weight: '1.37kg' }, tags: ['acer', 'swift', 'ultrabook'] },
      { cat: 'laptops', name: 'Samsung Galaxy Book4 Pro', brand: 'Samsung', mrp: 169990, bp: 128000, sp: 149999, b2b: 140000, imgs: getImages('electronics'), specs: { cpu: 'Intel Ultra 7', display: '16 AMOLED', ram: '16GB' }, tags: ['samsung', 'galaxy-book', 'intel'] },
      { cat: 'laptops', name: 'Razer Blade 16', brand: 'Razer', mrp: 399990, bp: 310000, sp: 359999, b2b: 340000, imgs: getImages('electronics'), specs: { cpu: 'Intel i9-14900HX', gpu: 'RTX 4090', display: 'Dual Mode OLED' }, tags: ['razer', 'gaming', 'blade'] },
      { cat: 'laptops', name: 'LG Gram 16 2024', brand: 'LG', mrp: 129990, bp: 97000, sp: 114999, b2b: 107000, imgs: getImages('electronics'), specs: { cpu: 'Intel Ultra 7', weight: '1.19kg', battery: '72Wh' }, tags: ['lg', 'gram', 'lightweight'] },

      // ── AUDIO (8) ──────────────────────────────────────────────────────
      { cat: 'audio', name: 'Sony WH-1000XM5', brand: 'Sony', mrp: 29990, bp: 18000, sp: 24999, b2b: 22000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', battery: '30hr' }, tags: ['sony', 'headphones', 'anc'] },
      { cat: 'audio', name: 'Bose QuietComfort 45', brand: 'Bose', mrp: 32990, bp: 20000, sp: 27999, b2b: 25000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', battery: '24hr' }, tags: ['bose', 'headphones', 'anc'] },
      { cat: 'audio', name: 'Apple AirPods Pro 2', brand: 'Apple', mrp: 24900, bp: 17000, sp: 21999, b2b: 20000, imgs: getImages('electronics'), specs: { type: 'In-ear', anc: 'Yes', chip: 'H2' }, tags: ['apple', 'airpods', 'anc'] },
      { cat: 'audio', name: 'Samsung Galaxy Buds 2 Pro', brand: 'Samsung', mrp: 17990, bp: 11000, sp: 14999, b2b: 13500, imgs: getImages('electronics'), specs: { type: 'In-ear', anc: 'Yes', audio: '360 Audio' }, tags: ['samsung', 'buds', 'anc'] },
      { cat: 'audio', name: 'JBL Charge 5 Speaker', brand: 'JBL', mrp: 16999, bp: 10000, sp: 13999, b2b: 12500, imgs: getImages('electronics'), specs: { type: 'Portable Speaker', waterproof: 'IP67', battery: '20hr' }, tags: ['jbl', 'speaker', 'bluetooth'] },
      { cat: 'audio', name: 'Marshall Emberton II', brand: 'Marshall', mrp: 14999, bp: 9000, sp: 12499, b2b: 11000, imgs: getImages('electronics'), specs: { type: 'Portable Speaker', waterproof: 'IPX7', battery: '30hr' }, tags: ['marshall', 'speaker', 'bluetooth'] },
      { cat: 'audio', name: 'Sennheiser Momentum 4', brand: 'Sennheiser', mrp: 34990, bp: 22000, sp: 29999, b2b: 27000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', battery: '60hr' }, tags: ['sennheiser', 'headphones', 'anc'] },
      { cat: 'audio', name: 'Jabra Evolve2 85', brand: 'Jabra', mrp: 39990, bp: 28000, sp: 34999, b2b: 31000, imgs: getImages('electronics'), specs: { type: 'Over-ear', anc: 'Yes', mic: 'Professional' }, tags: ['jabra', 'headset', 'business'] },

      // ── MEN'S WEAR (10) ───────────────────────────────────────────────
      { cat: 'mens-wear', name: 'Levi\'s 511 Slim Fit Jeans', brand: 'Levi\'s', mrp: 3999, bp: 1400, sp: 2999, b2b: 2600, imgs: getImages('clothing'), specs: { fit: 'Slim', material: 'Denim', waist: '32' }, tags: ['jeans', 'men', 'levis'] },
      { cat: 'mens-wear', name: 'Nike Dri-FIT Running Tee', brand: 'Nike', mrp: 2499, bp: 800, sp: 1799, b2b: 1500, imgs: getImages('clothing'), specs: { material: 'Polyester', fit: 'Regular', collar: 'Round' }, tags: ['tshirt', 'nike', 'sports'] },
      { cat: 'mens-wear', name: 'Allen Solly Formal Shirt', brand: 'Allen Solly', mrp: 2499, bp: 800, sp: 1799, b2b: 1500, imgs: getImages('clothing'), specs: { material: 'Cotton', fit: 'Regular', collar: 'Spread' }, tags: ['shirt', 'formal', 'men'] },
      { cat: 'mens-wear', name: 'H&M Slim Chino Pants', brand: 'H&M', mrp: 2999, bp: 900, sp: 1999, b2b: 1700, imgs: getImages('clothing'), specs: { fit: 'Slim', material: 'Cotton Blend', waist: '32' }, tags: ['chinos', 'men', 'casual'] },
      { cat: 'mens-wear', name: 'Zara Bomber Jacket', brand: 'Zara', mrp: 5999, bp: 1800, sp: 4299, b2b: 3800, imgs: getImages('clothing'), specs: { material: 'Polyester', style: 'Bomber', fit: 'Regular' }, tags: ['jacket', 'zara', 'men'] },
      { cat: 'mens-wear', name: 'US Polo ASSN Polo Tee', brand: 'US Polo', mrp: 1999, bp: 700, sp: 1399, b2b: 1200, imgs: getImages('clothing'), specs: { material: 'Cotton Pique', fit: 'Regular', collar: 'Polo' }, tags: ['polo', 'tshirt', 'men'] },
      { cat: 'mens-wear', name: 'Adidas Track Pants', brand: 'Adidas', mrp: 3999, bp: 1300, sp: 2799, b2b: 2400, imgs: getImages('clothing'), specs: { material: 'Polyester', fit: 'Tapered', closure: 'Elastic' }, tags: ['trackpants', 'adidas', 'sports'] },
      { cat: 'mens-wear', name: 'Peter England Check Shirt', brand: 'Peter England', mrp: 1999, bp: 650, sp: 1399, b2b: 1100, imgs: getImages('clothing'), specs: { pattern: 'Check', material: 'Cotton', fit: 'Slim' }, tags: ['shirt', 'check', 'formal'] },
      { cat: 'mens-wear', name: 'Puma Hoodie Sweatshirt', brand: 'Puma', mrp: 3499, bp: 1100, sp: 2499, b2b: 2100, imgs: getImages('clothing'), specs: { material: 'Fleece', fit: 'Regular', hood: 'Yes' }, tags: ['hoodie', 'puma', 'winter'] },
      { cat: 'mens-wear', name: 'Tommy Hilfiger Blazer', brand: 'Tommy Hilfiger', mrp: 12999, bp: 4500, sp: 9499, b2b: 8500, imgs: getImages('clothing'), specs: { material: 'Wool Blend', buttons: '2', fit: 'Slim' }, tags: ['blazer', 'tommy', 'formal'] },

      // ── WOMEN'S WEAR (10) ─────────────────────────────────────────────
      { cat: 'womens-wear', name: 'Zara Floral Maxi Dress', brand: 'Zara', mrp: 4999, bp: 1500, sp: 3499, b2b: 3000, imgs: getImages('clothing'), specs: { pattern: 'Floral', material: 'Viscose', length: 'Maxi' }, tags: ['dress', 'zara', 'women'] },
      { cat: 'womens-wear', name: 'H&M Linen Blazer', brand: 'H&M', mrp: 4499, bp: 1400, sp: 3199, b2b: 2800, imgs: getImages('clothing'), specs: { material: 'Linen', fit: 'Oversized', buttons: '2' }, tags: ['blazer', 'women', 'casual'] },
      { cat: 'womens-wear', name: 'Mango Satin Slip Dress', brand: 'Mango', mrp: 5999, bp: 2000, sp: 4299, b2b: 3800, imgs: getImages('clothing'), specs: { material: 'Satin', length: 'Midi', neckline: 'V-neck' }, tags: ['dress', 'mango', 'party'] },
      { cat: 'womens-wear', name: 'Levi\'s High Rise Jeans', brand: 'Levi\'s', mrp: 4499, bp: 1600, sp: 3199, b2b: 2800, imgs: getImages('clothing'), specs: { rise: 'High', fit: 'Straight', material: 'Denim' }, tags: ['jeans', 'women', 'levis'] },
      { cat: 'womens-wear', name: 'Nike Women\'s Sports Bra', brand: 'Nike', mrp: 2499, bp: 800, sp: 1799, b2b: 1500, imgs: getImages('clothing'), specs: { support: 'Medium', material: 'Dri-FIT', closure: 'Pullover' }, tags: ['sportswear', 'nike', 'women'] },
      { cat: 'womens-wear', name: 'AND Wrap Midi Skirt', brand: 'AND', mrp: 2999, bp: 900, sp: 2199, b2b: 1900, imgs: getImages('clothing'), specs: { length: 'Midi', material: 'Crepe', closure: 'Wrap' }, tags: ['skirt', 'and', 'women'] },
      { cat: 'womens-wear', name: 'Global Desi Kurta Set', brand: 'Global Desi', mrp: 3999, bp: 1200, sp: 2799, b2b: 2400, imgs: getImages('clothing'), specs: { material: 'Cotton', set: '3 piece', pattern: 'Ethnic' }, tags: ['kurta', 'ethnic', 'women'] },
      { cat: 'womens-wear', name: 'Forever 21 Crop Top', brand: 'Forever 21', mrp: 1499, bp: 500, sp: 999, b2b: 850, imgs: getImages('clothing'), specs: { material: 'Ribbed Knit', fit: 'Crop', neckline: 'Round' }, tags: ['croptop', 'women', 'casual'] },
      { cat: 'womens-wear', name: 'Vero Moda Trench Coat', brand: 'Vero Moda', mrp: 7999, bp: 2800, sp: 5799, b2b: 5200, imgs: getImages('clothing'), specs: { material: 'Polyester', belt: 'Tie', length: 'Long' }, tags: ['coat', 'women', 'winter'] },
      { cat: 'womens-wear', name: 'Marks & Spencer Jumpsuit', brand: 'M&S', mrp: 5499, bp: 1800, sp: 3999, b2b: 3500, imgs: getImages('clothing'), specs: { material: 'Jersey', fit: 'Wide Leg', neckline: 'V-neck' }, tags: ['jumpsuit', 'women', 'casual'] },

      // ── SNEAKERS (8) ──────────────────────────────────────────────────
      { cat: 'sneakers', name: 'Nike Air Max 270', brand: 'Nike', mrp: 11995, bp: 5500, sp: 8999, b2b: 8000, imgs: getImages('footwear'), specs: { sole: 'Air Max', size: '10 UK', color: 'Black/White' }, tags: ['sneakers', 'nike', 'airmax'] },
      { cat: 'sneakers', name: 'Adidas Ultraboost 23', brand: 'Adidas', mrp: 16999, bp: 8500, sp: 12999, b2b: 11500, imgs: getImages('footwear'), specs: { technology: 'Boost', size: '10 UK', color: 'Core Black' }, tags: ['sneakers', 'adidas', 'boost'] },
      { cat: 'sneakers', name: 'Puma RS-X Efekt', brand: 'Puma', mrp: 9999, bp: 4500, sp: 7499, b2b: 6800, imgs: getImages('footwear'), specs: { type: 'Chunky', size: '9 UK', color: 'White/Blue' }, tags: ['sneakers', 'puma', 'chunky'] },
      { cat: 'sneakers', name: 'New Balance 574 Core', brand: 'New Balance', mrp: 8999, bp: 4000, sp: 6999, b2b: 6200, imgs: getImages('footwear'), specs: { sole: 'ENCAP', size: '9 UK', color: 'Grey' }, tags: ['sneakers', 'newbalance', 'classic'] },
      { cat: 'sneakers', name: 'Converse Chuck Taylor All Star', brand: 'Converse', mrp: 5999, bp: 2500, sp: 4499, b2b: 4000, imgs: getImages('footwear'), specs: { upper: 'Canvas', size: '9 UK', sole: 'Rubber' }, tags: ['sneakers', 'converse', 'classic'] },
      { cat: 'sneakers', name: 'Skechers Go Walk Arch Fit', brand: 'Skechers', mrp: 5999, bp: 2200, sp: 4299, b2b: 3800, imgs: getImages('footwear'), specs: { insole: 'Arch Fit', size: '10 UK', width: 'Regular' }, tags: ['sneakers', 'skechers', 'comfort'] },
      { cat: 'sneakers', name: 'Reebok Classic Leather', brand: 'Reebok', mrp: 7999, bp: 3500, sp: 5999, b2b: 5400, imgs: getImages('footwear'), specs: { upper: 'Leather', size: '10 UK', color: 'White' }, tags: ['sneakers', 'reebok', 'classic'] },
      { cat: 'sneakers', name: 'FILA Disruptor II', brand: 'FILA', mrp: 6999, bp: 3000, sp: 4999, b2b: 4500, imgs: getImages('footwear'), specs: { type: 'Chunky', size: '9 UK', upper: 'Leather' }, tags: ['sneakers', 'fila', 'chunky'] },

      // ── FORMAL SHOES (5) ──────────────────────────────────────────────
      { cat: 'formal-shoes', name: 'Clarks Tilden Cap Oxford', brand: 'Clarks', mrp: 8999, bp: 3800, sp: 6799, b2b: 6100, imgs: getImages('footwear'), specs: { upper: 'Leather', size: '9 UK', color: 'Black' }, tags: ['formal', 'oxford', 'clarks'] },
      { cat: 'formal-shoes', name: 'Hush Puppies Leather Derby', brand: 'Hush Puppies', mrp: 5999, bp: 2200, sp: 4299, b2b: 3800, imgs: getImages('footwear'), specs: { upper: 'Leather', size: '10 UK', color: 'Brown' }, tags: ['formal', 'derby', 'leather'] },
      { cat: 'formal-shoes', name: 'Bata Senator Lace-Up', brand: 'Bata', mrp: 3499, bp: 1200, sp: 2499, b2b: 2200, imgs: getImages('footwear'), specs: { upper: 'Synthetic', size: '9 UK', color: 'Black' }, tags: ['formal', 'bata', 'laceup'] },
      { cat: 'formal-shoes', name: 'Red Tape Brogue Shoes', brand: 'Red Tape', mrp: 4999, bp: 1800, sp: 3499, b2b: 3100, imgs: getImages('footwear'), specs: { style: 'Brogue', size: '10 UK', upper: 'Leather' }, tags: ['brogue', 'formal', 'redtape'] },
      { cat: 'formal-shoes', name: 'Lee Cooper Oxford Shoes', brand: 'Lee Cooper', mrp: 3999, bp: 1400, sp: 2799, b2b: 2500, imgs: getImages('footwear'), specs: { style: 'Oxford', size: '9 UK', upper: 'Leather' }, tags: ['oxford', 'formal', 'leecooper'] },

      // ── WATCHES (8) ───────────────────────────────────────────────────
      { cat: 'watches', name: 'Titan Octane Chronograph', brand: 'Titan', mrp: 12995, bp: 6000, sp: 9999, b2b: 9000, imgs: getImages('accessories'), specs: { movement: 'Quartz', case: 'Steel', wr: '100m' }, tags: ['watch', 'titan', 'chronograph'] },
      { cat: 'watches', name: 'Casio G-Shock GA-2100', brand: 'Casio', mrp: 8995, bp: 4000, sp: 6999, b2b: 6200, imgs: getImages('accessories'), specs: { movement: 'Quartz', wr: '200m', case: 'Resin' }, tags: ['watch', 'casio', 'gshock'] },
      { cat: 'watches', name: 'Fossil Gen 6 Smartwatch', brand: 'Fossil', mrp: 22995, bp: 14000, sp: 17999, b2b: 16500, imgs: getImages('accessories'), specs: { os: 'Wear OS', battery: '24hr', strap: 'Leather' }, tags: ['smartwatch', 'fossil', 'wearos'] },
      { cat: 'watches', name: 'Apple Watch Series 9', brand: 'Apple', mrp: 41900, bp: 33000, sp: 37999, b2b: 35500, imgs: getImages('accessories'), specs: { chip: 'S9', display: 'LTPO OLED', health: 'ECG, SpO2' }, tags: ['smartwatch', 'apple', 'health'] },
      { cat: 'watches', name: 'Samsung Galaxy Watch 6', brand: 'Samsung', mrp: 29999, bp: 22000, sp: 26999, b2b: 25000, imgs: getImages('accessories'), specs: { os: 'Wear OS', battery: '40hr', health: 'BioActive Sensor' }, tags: ['smartwatch', 'samsung', 'health'] },
      { cat: 'watches', name: 'Seiko Presage Automatic', brand: 'Seiko', mrp: 24995, bp: 15000, sp: 20999, b2b: 19000, imgs: getImages('accessories'), specs: { movement: 'Automatic', wr: '50m', crystal: 'Sapphire' }, tags: ['watch', 'seiko', 'automatic'] },
      { cat: 'watches', name: 'Garmin Fenix 7X Solar', brand: 'Garmin', mrp: 89990, bp: 68000, sp: 79999, b2b: 75000, imgs: getImages('accessories'), specs: { gps: 'Multi-band', solar: 'Yes', battery: '37 days' }, tags: ['smartwatch', 'garmin', 'gps'] },
      { cat: 'watches', name: 'Noise ColorFit Pulse 4', brand: 'Noise', mrp: 4999, bp: 1800, sp: 3499, b2b: 3000, imgs: getImages('accessories'), specs: { display: '1.85 TFT', health: 'SpO2, HR', calls: 'Bluetooth' }, tags: ['smartwatch', 'noise', 'budget'] },

      // ── BAGS (5) ──────────────────────────────────────────────────────
      { cat: 'bags', name: 'Wildcraft 45L Hiking Backpack', brand: 'Wildcraft', mrp: 3999, bp: 1400, sp: 2799, b2b: 2400, imgs: getImages('accessories'), specs: { capacity: '45L', material: 'Nylon', waterproof: 'Yes' }, tags: ['backpack', 'wildcraft', 'hiking'] },
      { cat: 'bags', name: 'American Tourister Trolley Bag', brand: 'American Tourister', mrp: 8999, bp: 4000, sp: 6799, b2b: 6200, imgs: getImages('accessories'), specs: { capacity: '68L', wheels: '4-spinner', material: 'Polycarbonate' }, tags: ['luggage', 'travel', 'trolley'] },
      { cat: 'bags', name: 'Fastrack Office Messenger Bag', brand: 'Fastrack', mrp: 2999, bp: 1000, sp: 1999, b2b: 1700, imgs: getImages('accessories'), specs: { material: 'Canvas', laptop: '15.6 inch', color: 'Olive' }, tags: ['bag', 'office', 'messenger'] },
      { cat: 'bags', name: 'Lavie Women Tote Bag', brand: 'Lavie', mrp: 3499, bp: 1200, sp: 2299, b2b: 1900, imgs: getImages('accessories'), specs: { material: 'PU Leather', size: 'Large', pockets: '5' }, tags: ['tote', 'women', 'handbag'] },
      { cat: 'bags', name: 'Skybags Gym Duffel Bag', brand: 'Skybags', mrp: 2499, bp: 900, sp: 1699, b2b: 1400, imgs: getImages('accessories'), specs: { capacity: '30L', material: 'Polyester', compartments: '3' }, tags: ['duffel', 'gym', 'sports'] },

      // ── SUNGLASSES (4) ────────────────────────────────────────────────
      { cat: 'sunglasses', name: 'Ray-Ban Aviator Classic', brand: 'Ray-Ban', mrp: 10490, bp: 5500, sp: 8499, b2b: 7800, imgs: getImages('accessories'), specs: { frame: 'Metal', lens: 'G-15 UV', style: 'Aviator' }, tags: ['sunglasses', 'rayban', 'aviator'] },
      { cat: 'sunglasses', name: 'Oakley Holbrook Prizm', brand: 'Oakley', mrp: 14990, bp: 8000, sp: 12499, b2b: 11500, imgs: getImages('accessories'), specs: { lens: 'Prizm', frame: 'O-Matter', uv: 'UV400' }, tags: ['sunglasses', 'oakley', 'sports'] },
      { cat: 'sunglasses', name: 'Fastrack UV400 Wayfarer', brand: 'Fastrack', mrp: 1999, bp: 700, sp: 1399, b2b: 1200, imgs: getImages('accessories'), specs: { lens: 'UV400', frame: 'Plastic', style: 'Wayfarer' }, tags: ['sunglasses', 'fastrack', 'budget'] },
      { cat: 'sunglasses', name: 'Polaroid PLD 2109 Polarized', brand: 'Polaroid', mrp: 3990, bp: 1500, sp: 2799, b2b: 2400, imgs: getImages('accessories'), specs: { lens: 'Polarized', frame: 'Acetate', style: 'Rectangular' }, tags: ['sunglasses', 'polaroid', 'polarized'] },

      // ── KITCHEN (8) ───────────────────────────────────────────────────
      { cat: 'kitchen', name: 'Instant Pot Duo 7-in-1', brand: 'Instant Pot', mrp: 9999, bp: 5500, sp: 7999, b2b: 7200, imgs: getImages('home'), specs: { capacity: '6L', programs: '7', wattage: '1000W' }, tags: ['instantpot', 'kitchen', 'cooker'] },
      { cat: 'kitchen', name: 'Philips Air Fryer HD9252', brand: 'Philips', mrp: 11995, bp: 6500, sp: 8999, b2b: 8200, imgs: getImages('home'), specs: { capacity: '4.1L', wattage: '1400W', technology: 'Rapid Air' }, tags: ['airfryer', 'philips', 'healthy'] },
      { cat: 'kitchen', name: 'Prestige Deluxe Plus Pressure Cooker', brand: 'Prestige', mrp: 2999, bp: 1100, sp: 1999, b2b: 1700, imgs: getImages('home'), specs: { capacity: '5L', material: 'Aluminium', induction: 'No' }, tags: ['prestige', 'cooker', 'kitchen'] },
      { cat: 'kitchen', name: 'Butterfly Smart Mixer Grinder', brand: 'Butterfly', mrp: 4999, bp: 2000, sp: 3499, b2b: 3100, imgs: getImages('home'), specs: { wattage: '750W', jars: '3', speed: '3 settings' }, tags: ['mixer', 'grinder', 'kitchen'] },
      { cat: 'kitchen', name: 'Borosil Vision Glass Set of 6', brand: 'Borosil', mrp: 1499, bp: 550, sp: 999, b2b: 850, imgs: getImages('home'), specs: { capacity: '310ml', material: 'Borosilicate Glass', pieces: '6' }, tags: ['glassware', 'borosil', 'kitchen'] },
      { cat: 'kitchen', name: 'Hawkins Futura Non-Stick Wok', brand: 'Hawkins', mrp: 2499, bp: 950, sp: 1799, b2b: 1500, imgs: getImages('home'), specs: { diameter: '26cm', material: 'Hard Anodised', base: 'Flat' }, tags: ['wok', 'hawkins', 'nonstick'] },
      { cat: 'kitchen', name: 'Morphy Richards OTG 28L', brand: 'Morphy Richards', mrp: 7499, bp: 3800, sp: 5999, b2b: 5400, imgs: getImages('home'), specs: { capacity: '28L', wattage: '1500W', temperature: '100-250°C' }, tags: ['otg', 'oven', 'baking'] },
      { cat: 'kitchen', name: 'Pigeon Stainless Steel Tiffin', brand: 'Pigeon', mrp: 999, bp: 350, sp: 699, b2b: 580, imgs: getImages('home'), specs: { containers: '3', material: 'Stainless Steel', leak: 'Proof' }, tags: ['tiffin', 'lunchbox', 'kitchen'] },

      // ── FURNITURE (5) ─────────────────────────────────────────────────
      { cat: 'furniture', name: 'IKEA KALLAX Shelf Unit 4x4', brand: 'IKEA', mrp: 14999, bp: 8000, sp: 11999, b2b: 10800, imgs: getImages('home'), specs: { squares: '16', material: 'Particleboard', color: 'White' }, tags: ['shelf', 'ikea', 'storage'] },
      { cat: 'furniture', name: 'Nilkamal Plastic Chair Set of 4', brand: 'Nilkamal', mrp: 3999, bp: 1500, sp: 2799, b2b: 2400, imgs: getImages('home'), specs: { material: 'Plastic', pieces: '4', capacity: '110kg' }, tags: ['chair', 'nilkamal', 'outdoor'] },
      { cat: 'furniture', name: 'Durian Fabric 3-Seater Sofa', brand: 'Durian', mrp: 39999, bp: 22000, sp: 31999, b2b: 28000, imgs: getImages('home'), specs: { seating: '3', material: 'Fabric', legs: 'Wooden' }, tags: ['sofa', 'durian', 'living-room'] },
      { cat: 'furniture', name: 'Wakefit Orthopaedic Memory Foam Mattress', brand: 'Wakefit', mrp: 19999, bp: 10000, sp: 14999, b2b: 13500, imgs: getImages('home'), specs: { size: 'Queen', height: '6 inch', material: 'Memory Foam' }, tags: ['mattress', 'wakefit', 'sleep'] },
      { cat: 'furniture', name: 'Home Centre Study Desk with Storage', brand: 'Home Centre', mrp: 12999, bp: 6500, sp: 9999, b2b: 9000, imgs: getImages('home'), specs: { material: 'MDF', drawers: '2', color: 'Walnut' }, tags: ['desk', 'study', 'furniture'] },

      // ── CAMERAS (5) ───────────────────────────────────────────────────
      { cat: 'cameras', name: 'Canon EOS R50 Mirrorless', brand: 'Canon', mrp: 69990, bp: 52000, sp: 61999, b2b: 58000, imgs: getImages('electronics'), specs: { sensor: 'APS-C 24.2MP', video: '4K', lens: '18-45mm' }, tags: ['camera', 'canon', 'mirrorless'] },
      { cat: 'cameras', name: 'Sony Alpha ZV-E10', brand: 'Sony', mrp: 59990, bp: 44000, sp: 52999, b2b: 49500, imgs: getImages('electronics'), specs: { sensor: 'APS-C 24.2MP', video: '4K', vlog: 'Yes' }, tags: ['camera', 'sony', 'vlog'] },
      { cat: 'cameras', name: 'Nikon Z30 Mirrorless', brand: 'Nikon', mrp: 64990, bp: 48000, sp: 57999, b2b: 54000, imgs: getImages('electronics'), specs: { sensor: 'APS-C 20.9MP', video: '4K', display: 'Flip-out' }, tags: ['camera', 'nikon', 'mirrorless'] },
      { cat: 'cameras', name: 'GoPro HERO12 Black', brand: 'GoPro', mrp: 44990, bp: 32000, sp: 39999, b2b: 37500, imgs: getImages('electronics'), specs: { video: '5.3K', waterproof: '10m', stabilization: 'HyperSmooth 6.0' }, tags: ['gopro', 'action', 'waterproof'] },
      { cat: 'cameras', name: 'DJI Pocket 3 Creator Combo', brand: 'DJI', mrp: 54990, bp: 41000, sp: 48999, b2b: 46000, imgs: getImages('electronics'), specs: { sensor: '1 inch', video: '4K 120fps', stabilization: '3-axis' }, tags: ['dji', 'pocket', 'gimbal'] },
    ];

    const slugCount: Record<string, number> = {};
    let inserted = 0;

    for (const p of products) {
      const catId = catMap[p.cat];
      if (!catId) { console.warn(`Category not found: ${p.cat}`); continue; }

      // unique slug
      const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      slugCount[baseSlug] = (slugCount[baseSlug] || 0) + 1;
      const slug = slugCount[baseSlug] > 1 ? `${baseSlug}-${slugCount[baseSlug]}` : baseSlug;

      // unique SKU
      const skuPrefix = p.cat.toUpperCase().slice(0, 4);
      const sku = `${skuPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const cond = pick(statuses);
      const dmg = cond === 'new_with_minor_damage' ? 'Minor cosmetic scratch on surface' : null;
      const def = cond === 'new_with_defect' ? 'Minor functional defect, tested and working' : null;
      const stock = rand(5, 120);
      const isFeatured = Math.random() < 0.25;
      const isB2B = Math.random() < 0.6;

      await client.query(
        `INSERT INTO products (
           category_id, name, slug, description, sku, brand,
           mrp, buying_price, selling_price,
           condition, damage_description, defect_description,
           stock_quantity, minimum_stock_alert,
           is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
           images, specifications, weight_grams, tags,
           is_active, is_featured, created_by
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,$16,$17,$18,$19,$20,$21,true,$22,$23
         ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        [
          catId, p.name, slug,
          `${p.name} — premium quality product by ${p.brand}. Ideal for everyday use with great performance and durability.`,
          sku, p.brand,
          p.mrp, p.bp, p.sp,
          cond, dmg, def,
          stock, Math.max(3, Math.floor(stock * 0.1)),
          isB2B, isB2B ? p.b2b : null, isB2B ? rand(2, 10) : 1,
          JSON.stringify(p.imgs),
          JSON.stringify(p.specs),
          rand(100, 25000),
          p.tags,
          isFeatured, adminId
        ]
      );
      inserted++;
    }

    console.log(`✅ ${inserted} products seeded`);
    await client.query('COMMIT');
    console.log('🎉 Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
