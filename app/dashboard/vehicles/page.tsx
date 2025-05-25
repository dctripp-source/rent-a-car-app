// app/dashboard/vehicles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Car as CarIcon, Calendar, MapPin, DollarSign } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Slika vozila */}
              <div className="relative h-48 bg-gray-200">
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CarIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    vehicle.status === 'available' 
                      ? 'bg-green-100 text-green-800'
                      : vehicle.status === 'rented'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.status === 'available' ? 'Dostupno' : 
                     vehicle.status === 'rented' ? 'Iznajmljeno' : 'Održavanje'}
                  </span>
                </div>
              </div>

              {/* Informacije o vozilu */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {vehicle.brand} {vehicle.model}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{vehicle.year}. godina</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{vehicle.registration_number}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="font-semibold text-gray-900">{vehicle.daily_rate} KM/dan</span>
                  </div>
                </div>

                {/* Akcije */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center space-x-3">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                    title="Izmjeni"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-2"
                    disabled={vehicle.status === 'rented'}
                    title={vehicle.status === 'rented' ? 'Ne možete obrisati iznajmljeno vozilo' : 'Obriši'}
                  >
                    <Trash2 className={`h-5 w-5 ${vehicle.status === 'rented' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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