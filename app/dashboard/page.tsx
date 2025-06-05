// app/dashboard/page.tsx - Ažurirana verzija
'use client';

import { useEffect, useState } from 'react';
import { Car, Users, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface DashboardStats {
  totalVehicles: number;
  totalClients: number;
  activeRentals: number;
  reservedRentals: number;
  monthlyRevenue: number;
  availableVehicles: number;
  upcomingReservations: number;
  todaysReservations: number;
  potentialRevenue: number;
  occupancyRate: number;
}

export default function DashboardPage() {
  const { fetchWithAuth } = useApi();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalClients: 0,
    activeRentals: 0,
    reservedRentals: 0,
    monthlyRevenue: 0,
    availableVehicles: 0,
    upcomingReservations: 0,
    todaysReservations: 0,
    potentialRevenue: 0,
    occupancyRate: 0,
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
      console.log('Dashboard received data:', data);
      
      setStats({
        totalVehicles: data.totalVehicles || 0,
        totalClients: data.totalClients || 0,
        activeRentals: data.activeRentals || 0,
        reservedRentals: data.reservedRentals || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        availableVehicles: data.availableVehicles || 0,
        upcomingReservations: data.upcomingReservations || 0,
        todaysReservations: data.todaysReservations || 0,
        potentialRevenue: data.potentialRevenue || 0,
        occupancyRate: data.occupancyRate || 0,
      });
      
      setError('');
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'Greška pri učitavanju statistika');
    } finally {
      setLoading(false);
    }
  };

  const mainStatCards = [
    {
      title: 'Ukupno vozila',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-500',
      subtitle: `${stats.availableVehicles} dostupno`,
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
      color: 'bg-purple-500',
    },
    {
      title: 'Mjesečni prihod',
      value: `${stats.monthlyRevenue.toFixed(2)} KM`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
  ];

  const reservationCards = [
    {
      title: 'Rezervacije',
      value: stats.reservedRentals,
      icon: Clock,
      color: 'bg-yellow-500',
      subtitle: 'Ukupno rezervisano',
    },
    {
      title: 'Današnje rezervacije',
      value: stats.todaysReservations,
      icon: AlertCircle,
      color: stats.todaysReservations > 0 ? 'bg-orange-500' : 'bg-gray-400',
      subtitle: 'Treba aktivirati',
      urgent: stats.todaysReservations > 0,
    },
    {
      title: 'Narednih 7 dana',
      value: stats.upcomingReservations,
      icon: Calendar,
      color: 'bg-indigo-500',
      subtitle: 'Predstojećih rezervacija',
    },
    {
      title: 'Potencijalni prihod',
      value: `${stats.potentialRevenue.toFixed(2)} KM`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      subtitle: 'Od rezervacija',
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
            onClick={() => window.location.reload()}
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
        <div className="text-sm text-gray-500">
          Iskorišćenost vozila: {stats.occupancyRate}%
        </div>
      </div>

      {/* Alerts for urgent actions */}
      {stats.todaysReservations > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Pažnja: {stats.todaysReservations} rezervacija za danas
              </h3>
              <p className="text-sm text-orange-700">
                Imate rezervacije koje možda trebaju biti aktivirane danas. Provjerite kalendar.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainStatCards.map((stat, index) => {
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
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reservation Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Rezervacije i planiranje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reservationCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`bg-white rounded-lg shadow p-6 ${stat.urgent ? 'ring-2 ring-orange-500' : ''}`}>
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className={`text-xs ${stat.urgent ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                        {stat.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Brze akcije</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/calendar"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Kalendar</h3>
              <p className="text-sm text-gray-500">Pregledaj sve rezervacije</p>
            </div>
          </a>
          
          <a
            href="/dashboard/vehicles"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Car className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Vozila</h3>
              <p className="text-sm text-gray-500">Upravljaj vozilima</p>
            </div>
          </a>
          
          <a
            href="/dashboard/clients"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Klijenti</h3>
              <p className="text-sm text-gray-500">Upravljaj klijentima</p>
            </div>
          </a>
        </div>
      </div>

      {/* Summary Section */}
      {(stats.activeRentals > 0 || stats.reservedRentals > 0) && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Pregled aktivnosti</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• {stats.activeRentals} aktivnih iznajmljivanja u toku</p>
            <p>• {stats.reservedRentals} rezervacija čeka aktivaciju</p>
            <p>• {stats.availableVehicles} od {stats.totalVehicles} vozila dostupno</p>
            <p>• Mjesečni prihod: {stats.monthlyRevenue.toFixed(2)} KM, potencijalni dodatak: {stats.potentialRevenue.toFixed(2)} KM</p>
          </div>
        </div>
      )}
    </div>
  );
}