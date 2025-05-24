// app/dashboard/vehicles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import { Vehicle } from '@/types';
import VehicleModal from '@/components/VehicleModal';
import { useApi } from '@/hooks/useApi';

export default function VehiclesPage() {
  const { fetchWithAuth } = useApi();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setError('');
      const response = await fetchWithAuth('/api/vehicles');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch vehicles');
      }

      const data = await response.json();
      setVehicles(data);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      setError(error.message || 'Greška pri učitavanju vozila');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovo vozilo?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle');
      }

      // Refresh lista
      fetchVehicles();
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      alert(error.message || 'Greška pri brisanju vozila');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    fetchVehicles();
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
            onClick={fetchVehicles}
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
        <h1 className="text-2xl font-bold text-gray-900">Vozila</h1>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Dodaj vozilo
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Nemate dodanih vozila</p>
          <button
            onClick={handleAdd}
            className="text-blue-600 hover:text-blue-700"
          >
            Dodajte prvo vozilo
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marka i model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Godina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registracija
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cijena/dan
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
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.image_url ? (
                        <img
                          src={vehicle.image_url}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="h-10 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-16 bg-gray-200 rounded flex items-center justify-center">
                          <Upload className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.registration_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.daily_rate} KM
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : vehicle.status === 'rented'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status === 'available' ? 'Dostupno' : 
                         vehicle.status === 'rented' ? 'Iznajmljeno' : 'Održavanje'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={vehicle.status === 'rented'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <VehicleModal
          vehicle={selectedVehicle}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}