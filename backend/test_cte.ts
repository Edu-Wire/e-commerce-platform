import { query } from './src/config/database';
async function run() {
  try {
    const category_id = 2; // Assuming Clothing is ID 2
    let paramIdx = 1;
    const q = `
      SELECT COUNT(*) as count 
      FROM products p 
      JOIN categories c ON c.id = p.category_id 
      WHERE p.is_active = true 
      AND p.category_id IN (
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c JOIN cat_tree ct ON ct.id = c.parent_id
        )
        SELECT id FROM cat_tree
      )
    `;
    console.log("Query:", q);
    const res = await query(q, [category_id]);
    console.log("Result for category_id 2:", res[0].count);

    // Get all categories to find the correct ID for 'clothing'
    const catRes = await query(`SELECT id, name, slug FROM categories WHERE slug = 'clothing'`);
    console.log("Clothing category:", catRes);
    
    if (catRes.length > 0) {
      const actualId = catRes[0].id;
      const res2 = await query(q, [actualId]);
      console.log(`Result for actual category_id ${actualId}:`, res2[0].count);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
