import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' }, 
        { status: 401 }
      );
    }

    console.log('Dashboard stats - User ID:', userId);

    // Get all statistics in parallel
    const [
      vehiclesResult,
      clientsResult,
      activeRentalsResult,
      monthlyRevenueResult,
      availableVehiclesResult,
      rentedVehiclesResult,
      completedRentalsResult,
      upcomingReturnsResult
    ] = await Promise.all([
      // Total vehicles
      sql`SELECT COUNT(*) as count FROM vehicles WHERE user_id = ${userId}`,
      
      // Total clients
      sql`SELECT COUNT(*) as count FROM clients WHERE user_id = ${userId}`,
      
      // Active rentals
      sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'active' AND user_id = ${userId}`,
      
      // Monthly revenue
      sql`
        SELECT COALESCE(SUM(total_price), 0) as revenue 
        FROM rentals 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND user_id = ${userId}
      `,
      
      // Available vehicles
      sql`SELECT COUNT(*) as count FROM vehicles WHERE status = 'available' AND user_id = ${userId}`,
      
      // Rented vehicles
      sql`SELECT COUNT(*) as count FROM vehicles WHERE status = 'rented' AND user_id = ${userId}`,
      
      // Completed rentals this month
      sql`
        SELECT COUNT(*) as count 
        FROM rentals 
        WHERE status = 'completed' 
          AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND user_id = ${userId}
      `,
      
      // Upcoming returns (next 7 days)
      sql`
        SELECT COUNT(*) as count 
        FROM rentals 
        WHERE status = 'active' 
          AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND user_id = ${userId}
      `
    ]);

    console.log('Vehicles raw result:', vehiclesResult);
    console.log('Vehicles count value:', vehiclesResult[0].count);
    console.log('Vehicles count type:', typeof vehiclesResult[0].count);
    
    console.log('Clients raw result:', clientsResult);
    console.log('Clients count value:', clientsResult[0].count);
    console.log('Clients count type:', typeof clientsResult[0].count);

    // Calculate additional metrics
    const totalVehicles = parseInt(vehiclesResult[0].count);
    const availableVehicles = parseInt(availableVehiclesResult[0].count);
    const occupancyRate = totalVehicles > 0 
      ? ((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      // Basic stats
      totalVehicles,
      totalClients: parseInt(clientsResult[0].count),
      activeRentals: parseInt(activeRentalsResult[0].count),
      monthlyRevenue: parseFloat(monthlyRevenueResult[0].revenue),
      
      // Additional stats
      availableVehicles,
      rentedVehicles: parseInt(rentedVehiclesResult[0].count),
      completedRentalsThisMonth: parseInt(completedRentalsResult[0].count),
      upcomingReturns: parseInt(upcomingReturnsResult[0].count),
      occupancyRate: parseFloat(occupancyRate as string),
      
      // Metadata
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' }, 
      { status: 500 }
    );
  }
}

