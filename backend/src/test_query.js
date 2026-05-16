const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_Be9NIpbw1PWh@ep-odd-king-aptbksxo.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => client.query(`SELECT p.id as product_id, p.name as product_name, p.images as product_images,
              a.id as id, a.start_time, a.end_time, a.status, a.reserve_price
       FROM auctions a
       JOIN products p ON a.product_id = p.id
       WHERE a.status = 'active' 
         AND a.start_time > NOW()
         AND a.start_time <= NOW() + INTERVAL '24 HOURS'
       ORDER BY a.start_time ASC`))
.then(r => console.log(r.rows))
.catch(console.error)
.finally(() => client.end());
