'use client';

import { useEffect, useState } from 'react';
import { Car, Users, Calendar, TrendingUp, RefreshCw, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface DashboardStats {
  totalVehicles: number;
  totalClients: number;
  activeRentals: number;
  monthlyRevenue: number;
}

interface RecentActivity {
  id: number;
  type: 'rental_created' | 'rental_completed' | 'rental_cancelled' | 'vehicle_added';
  description: string;
  timestamp: string;
  client_name?: string;
  vehicle_info?: string;
}

interface UpcomingReturn {
  id: number;
  client_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  return_date: string;
  days_remaining: number;
  status: 'active' | 'overdue';
}

export default function DashboardPage() {
  const { fetchWithAuth } = useApi();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalClients: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<UpcomingReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh svakih 30 sekundi
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      const [statsRes, activitiesRes, returnsRes] = await Promise.all([
        fetchWithAuth('/api/dashboard/stats'),
        fetchWithAuth('/api/dashboard/recent-activities'),
        fetchWithAuth('/api/dashboard/upcoming-returns')
      ]);
      
      if (!statsRes.ok || !activitiesRes.ok || !returnsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();
      const returnsData = await returnsRes.json();
      
      setStats({
        totalVehicles: statsData.totalVehicles || 0,
        totalClients: statsData.totalClients || 0,
        activeRentals: statsData.activeRentals || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0,
      });

      setRecentActivities(activitiesData);
      setUpcomingReturns(returnsData);
      
      setLastUpdated(new Date());
      setError('');
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rental_created':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'rental_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rental_cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'vehicle_added':
        return <Car className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Prije manje od sat vremena';
    if (diffInHours < 24) return `Prije ${diffInHours} sati`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Prije ${diffInDays} dana`;
  };

  const statCards = [
    {
      title: 'Ukupno vozila',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-500',
    },
    {
      title: 'Ukupno klijenata',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Aktivnih iznajmljivanja',
      value: stats.activeRentals,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      title: 'Mjesečni prihod',
      value: `${stats.monthlyRevenue.toFixed(2)} KM`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Ažurirano: {lastUpdated.toLocaleTimeString('sr-RS')}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Osvježi
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activities and Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nedavne aktivnosti
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500">Nema nedavnih aktivnosti</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Returns */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Predstojeća vraćanja
          </h2>
          {upcomingReturns.length === 0 ? (
            <p className="text-gray-500">Nema predstojećih vraćanja</p>
          ) : (
            <div className="space-y-4">
              {upcomingReturns.slice(0, 5).map((returnItem) => (
                <div key={returnItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {returnItem.client_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {returnItem.vehicle_brand} {returnItem.vehicle_model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      returnItem.status === 'overdue' ? 'text-red-600' : 
                      returnItem.days_remaining <= 1 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {returnItem.status === 'overdue' 
                        ? `${Math.abs(returnItem.days_remaining)} dana kašnjenja`
                        : returnItem.days_remaining === 0 
                        ? 'Danas'
                        : `${returnItem.days_remaining} dana`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(returnItem.return_date).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}