// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Car, Users, Calendar, TrendingUp } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface DashboardStats {
  totalVehicles: number;
  totalClients: number;
  activeRentals: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const { fetchWithAuth } = useApi();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalClients: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetchWithAuth('/api/dashboard/stats');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      setStats({
        totalVehicles: data.totalVehicles || 0,
        totalClients: data.totalClients || 0,
        activeRentals: data.activeRentals || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'Greška pri učitavanju statistika');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardStats}
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Nedavne aktivnosti
          </h2>
          <p className="text-gray-500">Nema nedavnih aktivnosti</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Predstojeća vraćanja
          </h2>
          <p className="text-gray-500">Nema predstojećih vraćanja</p>
        </div>
      </div>
    </div>
  );
}