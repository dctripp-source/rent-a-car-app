// app/dashboard/contracts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Search, Calendar, User, Car } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Rental {
  id: number;
  vehicle_id: number;
  client_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  vehicle?: {
    brand: string;
    model: string;
    registration_number: string;
  };
  client?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default function ContractsPage() {
  const { fetchWithAuth } = useApi();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    filterRentals();
  }, [rentals, searchTerm, statusFilter]);

  const fetchRentals = async () => {
    try {
      setError('');
      
      // Use simpler API call to avoid header issues
      const response = await fetchWithAuth('/api/rentals');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rentals');
      }

      const data = await response.json();
      setRentals(data);
    } catch (error: any) {
      console.error('Error fetching rentals:', error);
      setError(error.message || 'Greška pri učitavanju ugovora');
    } finally {
      setLoading(false);
    }
  };

  const filterRentals = () => {
    let filtered = rentals;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rental => rental.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rental =>
        rental.client?.name.toLowerCase().includes(term) ||
        rental.vehicle?.brand.toLowerCase().includes(term) ||
        rental.vehicle?.model.toLowerCase().includes(term) ||
        rental.vehicle?.registration_number.toLowerCase().includes(term) ||
        rental.id.toString().includes(term)
      );
    }

    setFilteredRentals(filtered);
  };

  const handleDownloadContract = async (rentalId: number) => {
    try {
      setDownloading(rentalId);
      
      // Direct PDF download with minimal headers
      const response = await fetchWithAuth(`/api/rentals/${rentalId}/contract`);
      
      if (!response.ok) {
        throw new Error('Failed to download contract');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ugovor-${rentalId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error downloading contract:', error);
      alert('Greška pri preuzimanju ugovora: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktivan';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            onClick={fetchRentals}
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
        <h1 className="text-2xl font-bold text-gray-900">Ugovori</h1>
        <div className="text-sm text-gray-500">
          Ukupno: {filteredRentals.length} ugovora
        </div>
      </div>

      {/* Filters - Simplified */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po klijentu, broju ugovora ili vozilu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Svi statusi</option>
              <option value="active">Aktivni</option>
              <option value="completed">Završeni</option>
              <option value="cancelled">Otkazani</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRentals.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {rentals.length === 0 
              ? 'Nemate kreirana ugovora' 
              : 'Nema ugovora koji odgovaraju vašoj pretrazi'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ugovor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klijent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vozilo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Iznos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{rental.id.toString().padStart(3, '0')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(rental.created_at).toLocaleDateString('sr-RS')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.client?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.client?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Car className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.vehicle?.registration_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(rental.start_date).toLocaleDateString('sr-RS')} - 
                            {new Date(rental.end_date).toLocaleDateString('sr-RS')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(typeof rental.total_price === 'number' ? rental.total_price : parseFloat(rental.total_price)).toFixed(2)} KM
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                        {getStatusLabel(rental.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDownloadContract(rental.id)}
                        disabled={downloading === rental.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        title="Preuzmi ugovor"
                      >
                        {downloading === rental.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}