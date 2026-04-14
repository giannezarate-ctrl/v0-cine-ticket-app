import { sql } from './lib/db';

async function main() {
  const tickets = await sql`SELECT code, status, user_id, showtime_id FROM tickets LIMIT 10`;
  console.log('All tickets:', JSON.stringify(tickets, null, 2));
  
  const found = await sql`SELECT * FROM tickets WHERE code = 'TKT-5V3CJ879'`;
  console.log('TKT-5V3CJ879:', JSON.stringify(found, null, 2));
}

main();
