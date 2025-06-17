'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, Car as CarIcon, Calendar, MapPin, DollarSign, Filter, Fuel, Settings, Users } from 'lucide-react';
import { Vehicle } from '@/types';
import VehicleModal from '@/components/VehicleModal';
import { useApi } from '@/hooks/useApi';

type VehicleStatus = 'all' | 'available' | 'rented' | 'maintenance' | 'broken';

export default function VehiclesPage() {
  const { fetchWithAuth } = useApi();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus>('all');

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, statusFilter]);

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

  const filterVehicles = () => {
    if (statusFilter === 'all') {
      setFilteredVehicles(vehicles);
    } else {
      setFilteredVehicles(vehicles.filter(vehicle => vehicle.status === statusFilter));
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

  // Ispravljena funkcija za status labele - koristi Vehicle['status'] tip
  const getStatusLabel = (status: Vehicle['status']) => {
    switch (status) {
      case 'available': return 'Dostupno';
      case 'rented': return 'Iznajmljeno';
      case 'maintenance': return 'Servis';
      case 'broken': return 'Pokvareno';
      default: return status;
    }
  };

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline': return 'Benzin';
      case 'diesel': return 'Dizel';
      case 'hybrid': return 'Hibrid';
      case 'electric': return 'Električni';
      default: return fuelType;
    }
  };

  const getTransmissionLabel = (transmission: string) => {
    switch (transmission) {
      case 'manual': return 'Manuelni';
      case 'automatic': return 'Automatik';
      default: return transmission;
    }
  };

  const getStatusCount = (status: VehicleStatus) => {
    if (status === 'all') return vehicles.length;
    return vehicles.filter(v => v.status === status).length;
  };

  // Dodana funkcija za status boje da izbegne dugačke ternary operatore
  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'broken':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'Sva vozila' },
            { key: 'available', label: 'Dostupna' },
            { key: 'rented', label: 'Iznajmljena' },
            { key: 'maintenance', label: 'Servis' },
            { key: 'broken', label: 'Pokvarena' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as VehicleStatus)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                statusFilter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({getStatusCount(tab.key as VehicleStatus)})
            </button>
          ))}
        </nav>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all' 
              ? 'Nemate dodanih vozila' 
              : `Nema vozila sa statusom "${getStatusLabel(statusFilter as Vehicle['status'])}"`
            }
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={handleAdd}
              className="text-blue-600 hover:text-blue-700"
            >
              Dodajte prvo vozilo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle) => (
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
                {/* Status badge - koristi novu funkciju */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                    {getStatusLabel(vehicle.status)}
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

                  {/* Novi detalji */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center">
                      <Fuel className="h-4 w-4 mr-2" />
                      <span>{getFuelTypeLabel(vehicle.fuel_type || 'benzin')}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>{getTransmissionLabel(vehicle.transmission || 'manuelni')}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{vehicle.seat_count || 5} sjedišta</span>
                    </div>
                  </div>
                </div>

                {/* Akcije */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center space-x-3">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-2"
                    title="Izmijeni"
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