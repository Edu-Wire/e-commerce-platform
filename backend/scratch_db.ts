import { query } from './src/config/database';

async function test() {
  console.log('Running test query...');
  const res = await query('SELECT NOW()');
  console.log('Result:', res);
  process.exit(0);
}
test().catch(err => {
  console.error(err);
  process.exit(1);
});
