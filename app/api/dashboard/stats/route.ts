import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const [vehicles, clients, activeRentals, monthlyRevenue] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM vehicles`,
      sql`SELECT COUNT(*) as count FROM clients`,
      sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'active'`,
      sql`
        SELECT COALESCE(SUM(total_price), 0) as revenue 
        FROM rentals 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `,
    ]);

    return NextResponse.json({
      totalVehicles: vehicles[0].count,
      totalClients: clients[0].count,
      activeRentals: activeRentals[0].count,
      monthlyRevenue: parseFloat(monthlyRevenue[0].revenue),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}