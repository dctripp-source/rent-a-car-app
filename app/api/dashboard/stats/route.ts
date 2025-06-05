// app/api/dashboard/stats/route.ts - Ažurirana verzija
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/verify-token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      reservedRentalsResult,
      monthlyRevenueResult,
      availableVehiclesResult,
      rentedVehiclesResult,
      completedRentalsResult,
      upcomingReservationsResult,
      todaysReservationsResult
    ] = await Promise.all([
      // Total vehicles
      sql`SELECT COUNT(*) as count FROM vehicles WHERE user_id = ${userId}`,
      
      // Total clients
      sql`SELECT COUNT(*) as count FROM clients WHERE user_id = ${userId}`,
      
      // Active rentals
      sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'active' AND user_id = ${userId}`,
      
      // Reserved rentals
      sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'reserved' AND user_id = ${userId}`,
      
      // Monthly revenue (including both active and completed)
      sql`
        SELECT COALESCE(SUM(total_price), 0) as revenue 
        FROM rentals 
        WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
          AND status IN ('active', 'completed')
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
      
      // Upcoming reservations (next 7 days)
      sql`
        SELECT COUNT(*) as count 
        FROM rentals 
        WHERE status = 'reserved' 
          AND start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          AND user_id = ${userId}
      `,
      
      // Today's reservations that need activation
      sql`
        SELECT COUNT(*) as count 
        FROM rentals 
        WHERE status = 'reserved' 
          AND start_date = CURRENT_DATE
          AND user_id = ${userId}
      `
    ]);

    console.log('Vehicles raw result:', vehiclesResult);
    console.log('Reserved rentals:', reservedRentalsResult);
    
    // Calculate additional metrics
    const totalVehicles = parseInt(vehiclesResult[0].count);
    const availableVehicles = parseInt(availableVehiclesResult[0].count);
    const reservedRentals = parseInt(reservedRentalsResult[0].count);
    const activeRentals = parseInt(activeRentalsResult[0].count);
    
    const occupancyRate = totalVehicles > 0 
      ? (((totalVehicles - availableVehicles) / totalVehicles) * 100).toFixed(1)
      : 0;

    // Revenue projection including reserved rentals
    const potentialRevenueResult = await sql`
      SELECT COALESCE(SUM(total_price), 0) as revenue 
      FROM rentals 
      WHERE status = 'reserved'
        AND start_date >= CURRENT_DATE
        AND user_id = ${userId}
    `;

    return NextResponse.json({
      // Basic stats
      totalVehicles,
      totalClients: parseInt(clientsResult[0].count),
      activeRentals,
      reservedRentals,
      monthlyRevenue: parseFloat(monthlyRevenueResult[0].revenue),
      
      // Additional stats
      availableVehicles,
      rentedVehicles: parseInt(rentedVehiclesResult[0].count),
      completedRentalsThisMonth: parseInt(completedRentalsResult[0].count),
      upcomingReservations: parseInt(upcomingReservationsResult[0].count),
      todaysReservations: parseInt(todaysReservationsResult[0].count),
      potentialRevenue: parseFloat(potentialRevenueResult[0].revenue),
      occupancyRate: parseFloat(occupancyRate as string),
      
      // Summary metrics
      totalActiveBookings: activeRentals + reservedRentals,
      
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