import { query } from './src/config/database';
async function run() {
  const all = await query('SELECT count(*) FROM products');
  const active = await query('SELECT count(*) FROM products WHERE is_active = true');
  console.log('Total products:', all[0].count);
  console.log('Active products:', active[0].count);
  process.exit(0);
}
run();
