import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding admin user...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
    const adminRes = await client.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Admin Owner', 'admin@retail.com', adminPasswordHash, 'owner']
    );
    const adminId = adminRes.rows[0].id;
    console.log(`Admin user created with id: ${adminId}`);

    console.log('Seeding categories...');
    const catRes = await client.query(
      `INSERT INTO categories (name, slug, parent_id, is_active)
       VALUES
         ('Electronics', 'electronics', NULL, true),
         ('Clothing', 'clothing', NULL, true),
         ('Footwear', 'footwear', NULL, true),
         ('Accessories', 'accessories', NULL, true),
         ('Home & Kitchen', 'home-kitchen', NULL, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`
    );
    const catMap: Record<string, number> = {};
    for (const row of catRes.rows) {
      catMap[row.slug] = row.id;
    }
    console.log('Top-level categories:', catMap);

    const clothingId = catMap['clothing'];
    const electronicsId = catMap['electronics'];
    
    console.log('Seeding sub-categories...');
    const subCatRes = await client.query(
      `INSERT INTO categories (name, slug, parent_id, is_active)
       VALUES
         ('Men''s Wear', 'mens-wear', $1, true),
         ('Women''s Wear', 'womens-wear', $1, true),
         ('Kids'' Wear', 'kids-wear', $1, true),
         ('Fans', 'fans', $2, true),
         ('Watches', 'watches', $2, true),
         ('Air Conditioners', 'ac', $2, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`,
      [clothingId, electronicsId]
    );
    for (const row of subCatRes.rows) {
      catMap[row.slug] = row.id;
    }
    console.log('Sub-categories:', subCatRes.rows.map((r: any) => r.slug));

    console.log('Seeding spec templates for Clothing...');
    await client.query(`DELETE FROM category_spec_templates WHERE category_id = $1`, [clothingId]);
    await client.query(
      `INSERT INTO category_spec_templates (category_id, spec_key, spec_label, spec_type, spec_options, is_required, sort_order)
       VALUES
         ($1, 'size', 'Size', 'select', '["XS","S","M","L","XL","XXL"]', true, 1),
         ($1, 'color', 'Color', 'text', NULL, false, 2),
         ($1, 'material', 'Material', 'text', NULL, false, 3)`,
      [clothingId]
    );
    console.log('Spec templates created for Clothing');

    console.log('Seeding products...');
    const footwearId = catMap['footwear'];
    const accessoriesId = catMap['accessories'];
    const homeKitchenId = catMap['home-kitchen'];
    const mensWearId = catMap['mens-wear'];
    const womensWearId = catMap['womens-wear'];

    const products = [
      {
        category_id: electronicsId,
        name: 'Samsung 65-inch 4K Smart TV',
        slug: 'samsung-65-inch-4k-smart-tv',
        description: 'Crystal clear 4K UHD display with smart features',
        sku: 'ELEC-TV-001',
        brand: 'Samsung',
        mrp: 89999, buying_price: 55000, selling_price: 74999,
        condition: 'new', stock_quantity: 15, minimum_stock_alert: 3,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 70000, b2b_minimum_quantity: 2,
        images: JSON.stringify(['/uploads/products/spotlight/samsung.png', '/uploads/products/spotlight/tcl.png']),
        specifications: JSON.stringify({ resolution: '4K UHD', size: '65 inch', smart: true }),
        weight_grams: 28000, tags: ['electronics', 'tv', 'samsung', '4k'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Apple iPhone 15 Pro',
        slug: 'apple-iphone-15-pro',
        description: 'Latest iPhone with titanium design and A17 Pro chip',
        sku: 'ELEC-PHN-002',
        brand: 'Apple',
        mrp: 134900, buying_price: 100000, selling_price: 119999,
        condition: 'new', stock_quantity: 25, minimum_stock_alert: 5,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/iphone15pro.jpg']),
        specifications: JSON.stringify({ storage: '256GB', color: 'Natural Titanium', chip: 'A17 Pro' }),
        weight_grams: 187, tags: ['electronics', 'phone', 'apple', 'iphone'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Sony WH-1000XM5 Headphones',
        slug: 'sony-wh-1000xm5-headphones',
        description: 'Industry leading noise cancelling wireless headphones',
        sku: 'ELEC-AUD-003',
        brand: 'Sony',
        mrp: 29990, buying_price: 16000, selling_price: 22999,
        condition: 'new_with_minor_damage', damage_description: 'Minor scratch on left ear cup',
        stock_quantity: 8, minimum_stock_alert: 3,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 20000, b2b_minimum_quantity: 5,
        images: JSON.stringify(['/uploads/products/spotlight/sony.png']),
        specifications: JSON.stringify({ type: 'Over-ear', connectivity: 'Bluetooth 5.2', battery: '30 hours' }),
        weight_grams: 250, tags: ['electronics', 'audio', 'headphones', 'sony'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Dell XPS 15 Laptop',
        slug: 'dell-xps-15-laptop',
        description: 'Premium laptop with OLED display and Intel Core i7',
        sku: 'ELEC-LAP-004',
        brand: 'Dell',
        mrp: 149990, buying_price: 105000, selling_price: 129999,
        condition: 'new_with_defect', defect_description: 'Battery holds 90% capacity',
        stock_quantity: 4, minimum_stock_alert: 2,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 120000, b2b_minimum_quantity: 3,
        images: JSON.stringify(['/uploads/products/dell-xps.jpg']),
        specifications: JSON.stringify({ processor: 'Intel Core i7-13700H', ram: '16GB', storage: '512GB SSD', display: '15.6 inch OLED' }),
        weight_grams: 1860, tags: ['electronics', 'laptop', 'dell'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: mensWearId,
        name: 'Nike Dri-FIT T-Shirt Men',
        slug: 'nike-drifit-tshirt-men',
        description: 'Sweat-wicking performance t-shirt for active men',
        sku: 'CLO-MEN-005',
        brand: 'Nike',
        mrp: 1999, buying_price: 700, selling_price: 1499,
        condition: 'new', stock_quantity: 100, minimum_stock_alert: 20,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 1200, b2b_minimum_quantity: 12,
        images: JSON.stringify(['/uploads/products/nike-tshirt.jpg']),
        specifications: JSON.stringify({ size: 'M', color: 'Black', material: 'Polyester' }),
        weight_grams: 200, tags: ['clothing', 'men', 'nike', 'sportswear'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: mensWearId,
        name: "Levi's 501 Original Fit Jeans",
        slug: 'levis-501-original-fit-jeans',
        description: 'Classic straight leg jeans with original fit',
        sku: 'CLO-MEN-006',
        brand: "Levi's",
        mrp: 3999, buying_price: 1500, selling_price: 2999,
        condition: 'new', stock_quantity: 60, minimum_stock_alert: 10,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/levis-jeans.jpg']),
        specifications: JSON.stringify({ size: '32x30', color: 'Dark Blue', material: 'Denim' }),
        weight_grams: 700, tags: ['clothing', 'men', 'jeans', 'levis'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: womensWearId,
        name: 'Zara Floral Summer Dress',
        slug: 'zara-floral-summer-dress',
        description: 'Light and breezy floral print summer dress',
        sku: 'CLO-WOM-007',
        brand: 'Zara',
        mrp: 2999, buying_price: 900, selling_price: 1999,
        condition: 'new', stock_quantity: 45, minimum_stock_alert: 8,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/zara-dress.jpg']),
        specifications: JSON.stringify({ size: 'S', color: 'Multicolor Floral', material: 'Viscose' }),
        weight_grams: 350, tags: ['clothing', 'women', 'dress', 'summer'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: footwearId,
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        description: 'Lifestyle shoe with large Air unit for all-day comfort',
        sku: 'FTW-SNK-008',
        brand: 'Nike',
        mrp: 11995, buying_price: 5000, selling_price: 8999,
        condition: 'new', stock_quantity: 30, minimum_stock_alert: 6,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 7500, b2b_minimum_quantity: 6,
        images: JSON.stringify(['/uploads/products/nike-airmax.jpg']),
        specifications: JSON.stringify({ size: '10 UK', color: 'Black/White', sole: 'Air Max' }),
        weight_grams: 900, tags: ['footwear', 'sneakers', 'nike'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: footwearId,
        name: 'Adidas Ultraboost 22',
        slug: 'adidas-ultraboost-22',
        description: 'Energy-returning running shoes with Boost midsole',
        sku: 'FTW-RUN-009',
        brand: 'Adidas',
        mrp: 16999, buying_price: 8000, selling_price: 12999,
        condition: 'new', stock_quantity: 20, minimum_stock_alert: 4,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/adidas-ultraboost.jpg']),
        specifications: JSON.stringify({ size: '9 UK', color: 'Core Black', type: 'Running' }),
        weight_grams: 850, tags: ['footwear', 'running', 'adidas'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: footwearId,
        name: 'Bata Formal Oxford Shoes',
        slug: 'bata-formal-oxford-shoes',
        description: 'Classic leather oxford shoes for formal occasions',
        sku: 'FTW-FRM-010',
        brand: 'Bata',
        mrp: 3999, buying_price: 1200, selling_price: 2499,
        condition: 'new_with_minor_damage', damage_description: 'Minor scuff on left heel',
        stock_quantity: 12, minimum_stock_alert: 4,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/bata-oxford.jpg']),
        specifications: JSON.stringify({ size: '9 UK', color: 'Black', material: 'Leather' }),
        weight_grams: 1000, tags: ['footwear', 'formal', 'bata'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: accessoriesId,
        name: 'Titan Edge Slim Watch',
        slug: 'titan-edge-slim-watch',
        description: 'Ultra-slim analog watch with sapphire crystal glass',
        sku: 'ACC-WCH-011',
        brand: 'Titan',
        mrp: 9995, buying_price: 4000, selling_price: 7499,
        condition: 'new', stock_quantity: 18, minimum_stock_alert: 4,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 6500, b2b_minimum_quantity: 5,
        images: JSON.stringify(['/uploads/products/titan-watch.jpg']),
        specifications: JSON.stringify({ movement: 'Quartz', case_material: 'Stainless Steel', water_resistance: '30m' }),
        weight_grams: 80, tags: ['accessories', 'watch', 'titan'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: accessoriesId,
        name: 'Fossil Gen 6 Smartwatch',
        slug: 'fossil-gen-6-smartwatch',
        description: 'Wear OS smartwatch with health tracking features',
        sku: 'ACC-WCH-012',
        brand: 'Fossil',
        mrp: 22995, buying_price: 14000, selling_price: 17999,
        condition: 'new', stock_quantity: 10, minimum_stock_alert: 3,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/fossil-smartwatch.jpg']),
        specifications: JSON.stringify({ os: 'Wear OS 3', battery: '1 day', connectivity: 'Bluetooth/WiFi' }),
        weight_grams: 95, tags: ['accessories', 'smartwatch', 'fossil'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: accessoriesId,
        name: 'Wildcraft 40L Backpack',
        slug: 'wildcraft-40l-backpack',
        description: 'Durable outdoor backpack with rain cover',
        sku: 'ACC-BAG-013',
        brand: 'Wildcraft',
        mrp: 3499, buying_price: 1200, selling_price: 2299,
        condition: 'new', stock_quantity: 40, minimum_stock_alert: 8,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 1999, b2b_minimum_quantity: 10,
        images: JSON.stringify(['/uploads/products/wildcraft-backpack.jpg']),
        specifications: JSON.stringify({ capacity: '40L', material: 'Nylon', color: 'Olive Green' }),
        weight_grams: 900, tags: ['accessories', 'bag', 'outdoor', 'wildcraft'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: homeKitchenId,
        name: 'Prestige Induction Cooktop',
        slug: 'prestige-induction-cooktop',
        description: 'Smart induction cooktop with auto-off safety feature',
        sku: 'HMK-KCH-014',
        brand: 'Prestige',
        mrp: 4995, buying_price: 2200, selling_price: 3499,
        condition: 'new', stock_quantity: 22, minimum_stock_alert: 5,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 3000, b2b_minimum_quantity: 5,
        images: JSON.stringify(['/uploads/products/prestige-induction.jpg']),
        specifications: JSON.stringify({ wattage: '2000W', voltage: '230V', type: 'Induction' }),
        weight_grams: 1500, tags: ['kitchen', 'cooking', 'prestige', 'induction'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: homeKitchenId,
        name: 'Philips Air Fryer',
        slug: 'philips-air-fryer',
        description: 'Rapid Air technology for healthy fried food',
        sku: 'HMK-APL-015',
        brand: 'Philips',
        mrp: 11995, buying_price: 6500, selling_price: 8999,
        condition: 'new', stock_quantity: 14, minimum_stock_alert: 3,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/philips-airfryer.jpg']),
        specifications: JSON.stringify({ capacity: '4.1L', wattage: '1400W', temperature_range: '80-200C' }),
        weight_grams: 3200, tags: ['kitchen', 'cooking', 'philips', 'healthy'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: homeKitchenId,
        name: 'Wonderchef Non-Stick Cookware Set',
        slug: 'wonderchef-nonstick-cookware-set',
        description: '5-piece non-stick cookware set with induction base',
        sku: 'HMK-CKW-016',
        brand: 'Wonderchef',
        mrp: 7999, buying_price: 3000, selling_price: 5499,
        condition: 'new_with_defect', defect_description: 'One lid has minor chip on rim',
        stock_quantity: 7, minimum_stock_alert: 3,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 4800, b2b_minimum_quantity: 3,
        images: JSON.stringify(['/uploads/products/wonderchef-cookware.jpg']),
        specifications: JSON.stringify({ pieces: '5', material: 'Aluminium Non-stick', base: 'Induction compatible' }),
        weight_grams: 3500, tags: ['kitchen', 'cookware', 'wonderchef'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Bosch 8kg Front Load Washing Machine',
        slug: 'bosch-8kg-front-load-washing-machine',
        description: 'EcoSilence Drive washing machine with ActiveWater Plus',
        sku: 'ELEC-APL-017',
        brand: 'Bosch',
        mrp: 54990, buying_price: 32000, selling_price: 44999,
        condition: 'new', stock_quantity: 6, minimum_stock_alert: 2,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/bosch-washer.jpg']),
        specifications: JSON.stringify({ capacity: '8kg', rpm: '1200', energy_rating: '5 Star' }),
        weight_grams: 65000, tags: ['electronics', 'appliance', 'washing-machine', 'bosch'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Canon EOS 1500D DSLR Camera',
        slug: 'canon-eos-1500d-dslr-camera',
        description: '24.1MP APS-C sensor DSLR with 18-55mm kit lens',
        sku: 'ELEC-CAM-018',
        brand: 'Canon',
        mrp: 39995, buying_price: 24000, selling_price: 31999,
        condition: 'new_with_minor_damage', damage_description: 'Tiny dent on lens cap, camera body mint condition',
        stock_quantity: 5, minimum_stock_alert: 2,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 28000, b2b_minimum_quantity: 2,
        images: JSON.stringify(['/uploads/products/canon-dslr.jpg']),
        specifications: JSON.stringify({ megapixels: '24.1', sensor: 'APS-C', lens: '18-55mm IS II' }),
        weight_grams: 1200, tags: ['electronics', 'camera', 'canon', 'dslr'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: accessoriesId,
        name: 'Ray-Ban Wayfarer Sunglasses',
        slug: 'rayban-wayfarer-sunglasses',
        description: 'Classic wayfarer frame with UV400 polarized lenses',
        sku: 'ACC-SUN-019',
        brand: 'Ray-Ban',
        mrp: 8490, buying_price: 4000, selling_price: 6499,
        condition: 'new', stock_quantity: 25, minimum_stock_alert: 5,
        is_b2b_available: false, is_b2c_available: true, b2b_price: null, b2b_minimum_quantity: 1,
        images: JSON.stringify(['/uploads/products/spotlight/rayban.png']),
        specifications: JSON.stringify({ frame: 'Acetate', lens: 'Polarized UV400', style: 'Wayfarer' }),
        weight_grams: 35, tags: ['accessories', 'sunglasses', 'rayban'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: homeKitchenId,
        name: 'IKEA KALLAX Shelf Unit',
        slug: 'ikea-kallax-shelf-unit',
        description: '4-cube shelf unit perfect for storage and display',
        sku: 'HMK-FRN-020',
        brand: 'IKEA',
        mrp: 6999, buying_price: 3500, selling_price: 5499,
        condition: 'new', stock_quantity: 11, minimum_stock_alert: 3,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 4800, b2b_minimum_quantity: 4,
        images: JSON.stringify(['/uploads/products/ikea-kallax.jpg']),
        specifications: JSON.stringify({ dimensions: '77x77cm', material: 'Particleboard', color: 'White' }),
        weight_grams: 22000, tags: ['home', 'furniture', 'storage', 'ikea'],
        is_featured: false, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'TCL 55-inch QLED 4K TV',
        slug: 'tcl-55-inch-qled-4k-tv',
        description: 'High performance QLED display with Google TV',
        sku: 'ELEC-TV-021',
        brand: 'TCL',
        mrp: 59999, buying_price: 35000, selling_price: 42999,
        condition: 'new', stock_quantity: 12, minimum_stock_alert: 3,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 38000, b2b_minimum_quantity: 3,
        images: JSON.stringify(['/uploads/products/spotlight/tcl.png']),
        specifications: JSON.stringify({ resolution: '4K QLED', size: '55 inch', smart: true }),
        weight_grams: 18000, tags: ['electronics', 'tv', 'tcl', 'qled'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Carrier 1.5 Ton 5 Star Inverter AC',
        slug: 'carrier-1-5-ton-5-star-inverter-ac',
        description: 'Energy efficient inverter AC with fast cooling',
        sku: 'ELEC-AC-022',
        brand: 'Carrier',
        mrp: 67990, buying_price: 38000, selling_price: 45999,
        condition: 'new', stock_quantity: 8, minimum_stock_alert: 2,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 42000, b2b_minimum_quantity: 2,
        images: JSON.stringify(['/uploads/products/spotlight/carrier.png']),
        specifications: JSON.stringify({ capacity: '1.5 Ton', energy_rating: '5 Star', type: 'Inverter' }),
        weight_grams: 45000, tags: ['electronics', 'ac', 'carrier', 'cooling'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: catMap['home-kitchen'],
        name: 'Pampers Premium Care Diapers',
        slug: 'pampers-premium-care-diapers',
        description: 'Extra soft diapers for ultimate skin protection',
        sku: 'HMK-KDS-023',
        brand: 'Pampers',
        mrp: 1499, buying_price: 700, selling_price: 1199,
        condition: 'new', stock_quantity: 100, minimum_stock_alert: 20,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 900, b2b_minimum_quantity: 10,
        images: JSON.stringify(['/uploads/products/spotlight/pampers.png']),
        specifications: JSON.stringify({ size: 'Large', count: '64 units', material: 'Cotton soft' }),
        weight_grams: 1200, tags: ['home', 'baby', 'pampers', 'diapers'],
        is_featured: true, created_by: adminId
      },
      {
        category_id: electronicsId,
        name: 'Voltas 1.4 Ton 3 Star Inverter AC',
        slug: 'voltas-1-4-ton-3-star-inverter-ac',
        description: 'Reliable and affordable inverter AC for small rooms',
        sku: 'ELEC-AC-024',
        brand: 'Voltas',
        mrp: 45990, buying_price: 25000, selling_price: 32999,
        condition: 'new', stock_quantity: 10, minimum_stock_alert: 2,
        is_b2b_available: true, is_b2c_available: true, b2b_price: 30000, b2b_minimum_quantity: 2,
        images: JSON.stringify(['/uploads/products/spotlight/voltas.png']),
        specifications: JSON.stringify({ capacity: '1.4 Ton', energy_rating: '3 Star', type: 'Inverter' }),
        weight_grams: 40000, tags: ['electronics', 'ac', 'voltas', 'cooling'],
        is_featured: true, created_by: adminId
      }
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
          category_id, name, slug, description, sku, brand, mrp, buying_price, selling_price,
          condition, damage_description, defect_description, stock_quantity, minimum_stock_alert,
          is_b2b_available, is_b2c_available, b2b_price, b2b_minimum_quantity,
          images, specifications, weight_grams, tags, is_active, is_featured, created_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,true,$23,$24
        ) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        [
          p.category_id, p.name, p.slug, p.description, p.sku, p.brand,
          p.mrp, p.buying_price, p.selling_price,
          p.condition,
          (p as any).damage_description || null,
          (p as any).defect_description || null,
          p.stock_quantity, p.minimum_stock_alert,
          p.is_b2b_available, p.is_b2c_available,
          p.b2b_price || null,
          p.b2b_minimum_quantity,
          p.images, p.specifications,
          p.weight_grams,
          p.tags,
          p.is_featured,
          p.created_by
        ]
      );
    }
    console.log(`${products.length} products seeded`);

    console.log('Seeding customers...');
    const b2cPasswordHash = await bcrypt.hash('Customer@123', 12);
    const b2bPasswordHash = await bcrypt.hash('Business@123', 12);

    const b2cRes = await client.query(
      `INSERT INTO customers (name, email, password_hash, phone, customer_type, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        'Rahul Sharma', 'rahul@example.com', b2cPasswordHash, '9876543210', 'b2c',
        JSON.stringify({ street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' })
      ]
    );
    const b2cCustomerId = b2cRes.rows[0].id;

    const b2bRes = await client.query(
      `INSERT INTO customers (name, email, password_hash, phone, customer_type, company_name, gst_number, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        'Priya Patel', 'priya@acmecorp.com', b2bPasswordHash, '9123456780', 'b2b',
        'ACME Corp Pvt Ltd', '29ABCDE1234F1Z5',
        JSON.stringify({ street: '45 Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' })
      ]
    );
    const b2bCustomerId = b2bRes.rows[0].id;
    console.log(`Customers created: B2C id=${b2cCustomerId}, B2B id=${b2bCustomerId}`);

    console.log('Seeding orders...');
    // Get some product ids for orders
    const prodResult = await client.query(`SELECT id, sku, mrp, selling_price, b2b_price, is_b2b_available FROM products LIMIT 5`);
    const prods = prodResult.rows;

    // Order 1: B2C order
    const order1Items = [
      { product_id: prods[0].id, sku: prods[0].sku, quantity: 1, mrp: parseFloat(prods[0].mrp), selling_price: parseFloat(prods[0].selling_price) },
      { product_id: prods[1].id, sku: prods[1].sku, quantity: 1, mrp: parseFloat(prods[1].mrp), selling_price: parseFloat(prods[1].selling_price) }
    ];
    const order1TotalMrp = order1Items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const order1TotalSelling = order1Items.reduce((s, i) => s + i.selling_price * i.quantity, 0);
    await client.query(
      `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, shipping_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        b2cCustomerId, 'b2c', 'delivered',
        order1TotalMrp, order1TotalSelling, order1TotalMrp - order1TotalSelling,
        JSON.stringify(order1Items),
        JSON.stringify({ street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' })
      ]
    );

    // Order 2: B2C order pending
    const order2Items = [
      { product_id: prods[2].id, sku: prods[2].sku, quantity: 2, mrp: parseFloat(prods[2].mrp), selling_price: parseFloat(prods[2].selling_price) }
    ];
    const order2TotalMrp = order2Items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const order2TotalSelling = order2Items.reduce((s, i) => s + i.selling_price * i.quantity, 0);
    await client.query(
      `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, shipping_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        b2cCustomerId, 'b2c', 'pending',
        order2TotalMrp, order2TotalSelling, order2TotalMrp - order2TotalSelling,
        JSON.stringify(order2Items),
        JSON.stringify({ street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' })
      ]
    );

    // Order 3: B2B order
    const b2bProd = prods.find((p: any) => p.is_b2b_available) || prods[0];
    const b2bPrice = parseFloat(b2bProd.b2b_price || b2bProd.selling_price);
    const order3Items = [
      { product_id: b2bProd.id, sku: b2bProd.sku, quantity: 5, mrp: parseFloat(b2bProd.mrp), selling_price: b2bPrice }
    ];
    const order3TotalMrp = order3Items.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const order3TotalSelling = order3Items.reduce((s, i) => s + i.selling_price * i.quantity, 0);
    await client.query(
      `INSERT INTO orders (customer_id, order_type, status, total_mrp, total_selling_price, total_savings, items, shipping_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        b2bCustomerId, 'b2b', 'confirmed',
        order3TotalMrp, order3TotalSelling, order3TotalMrp - order3TotalSelling,
        JSON.stringify(order3Items),
        JSON.stringify({ street: '45 Industrial Area', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }),
        'Please deliver on weekdays only'
      ]
    );
    console.log('3 sample orders created');

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
