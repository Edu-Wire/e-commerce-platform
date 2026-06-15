import { query } from './config/database';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Creating support_tickets table...");
  await query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      priority VARCHAR(50) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
      status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
      assignee VARCHAR(255),
      category VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `);

  console.log("Creating activity_logs table...");
  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      admin_name VARCHAR(255) NOT NULL,
      action VARCHAR(500) NOT NULL,
      module VARCHAR(255) NOT NULL,
      ip_address VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Completed',
      severity VARCHAR(50) NOT NULL CHECK (severity IN ('Critical Change', 'Standard Update', 'Login Event')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Seed Support Tickets if empty
  const ticketCountRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM support_tickets");
  if (parseInt(ticketCountRes[0]?.count || '0') === 0) {
    console.log("Seeding support_tickets...");
    await query(`
      INSERT INTO support_tickets (customer_name, subject, priority, status, assignee, category, created_at, resolved_at) VALUES
      ('Aarav Sharma', 'Refund delay for order #10850', 'High', 'Open', 'Jane Smith (Support)', 'Refund Dispute', NOW() - INTERVAL '2 hours', NULL),
      ('Rohan Gupta', 'Payout settlement not credited to bank', 'Critical', 'In Progress', 'John Doe (Finance)', 'Refund Dispute', NOW() - INTERVAL '1 day', NULL),
      ('Priya Patel', 'Address change request after dispatch', 'Medium', 'Resolved', 'Alex Jones (Logistics)', 'Logistics Delay', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
      ('Sneha Reddy', 'Unable to bid in Live Auction', 'High', 'Resolved', 'Sam Wilson (Tech)', 'Bidding Error', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
      ('Vikram Malhotra', 'Item received damaged in shipping', 'High', 'Open', 'Jane Smith (Support)', 'Logistics Delay', NOW() - INTERVAL '5 hours', NULL),
      ('Ananya Iyer', 'Promo code not applying at checkout', 'Low', 'Resolved', 'Sam Wilson (Tech)', 'Bidding Error', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days')
    `);
  }

  // Seed Activity Logs if empty
  const logCountRes = await query<{ count: string }>("SELECT COUNT(*) as count FROM activity_logs");
  if (parseInt(logCountRes[0]?.count || '0') === 0) {
    console.log("Seeding activity_logs...");
    await query(`
      INSERT INTO activity_logs (admin_name, action, module, ip_address, status, severity, created_at) VALUES
      ('Kabir Singh', 'Modified system auction settings', 'System Settings', '192.168.1.45', 'Completed', 'Critical Change', NOW() - INTERVAL '1 hour'),
      ('Kabir Singh', 'Created new category: Smart Living', 'Categories', '192.168.1.45', 'Completed', 'Standard Update', NOW() - INTERVAL '3 hours'),
      ('Rohan Gupta', 'Seller Central Login', 'Auth', '103.45.2.19', 'Successful', 'Login Event', NOW() - INTERVAL '4 hours'),
      ('Vikram Malhotra', 'Failed login attempt (Wrong Pass)', 'Auth', '188.45.1.22', 'Blocked', 'Login Event', NOW() - INTERVAL '6 hours'),
      ('Neha Sharma', 'Updated product stock for SKU-8820', 'Inventory', '192.168.1.50', 'Completed', 'Standard Update', NOW() - INTERVAL '1 day'),
      ('Kabir Singh', 'Deactivated seller account: TechHub', 'Sellers', '192.168.1.45', 'Completed', 'Critical Change', NOW() - INTERVAL '2 days')
    `);
  }

  console.log("Tables created and seeded successfully!");
}

main().then(() => process.exit(0)).catch(console.error);


