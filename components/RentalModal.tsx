// components/RentalModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Vehicle, Client } from '@/types';
import { useApi } from '@/hooks/useApi';

interface RentalModalProps {
  vehicles: Vehicle[];
  onClose: () => void;
}

export default function RentalModal({ vehicles, onClose }: RentalModalProps) {
  const { fetchWithAuth } = useApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    client_id: '',
    start_date: '',
    end_date: '',
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [formData.vehicle_id, formData.start_date, formData.end_date]);

  const fetchClients = async () => {
    try {
      const response = await fetchWithAuth('/api/clients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      setError('Greška pri učitavanju klijenata');
    } finally {
      setLoadingClients(false);
    }
  };

  const calculatePrice = () => {
    if (formData.vehicle_id && formData.start_date && formData.end_date) {
      const vehicle = vehicles.find(v => v.id.toString() === formData.vehicle_id);
      if (vehicle) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        if (days > 0) {
          setTotalPrice(days * vehicle.daily_rate);
        } else {
          setTotalPrice(0);
        }
      }
    } else {
      setTotalPrice(0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validacija
      if (!formData.vehicle_id || !formData.client_id || !formData.start_date || !formData.end_date) {
        throw new Error('Sva polja su obavezna');
      }

      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('Datum završetka mora biti nakon datuma početka');
      }

      if (totalPrice <= 0) {
        throw new Error('Neispravna cijena');
      }

      const response = await fetchWithAuth('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          total_price: totalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri kreiranju iznajmljivanja');
      }

      onClose();
    } catch (error: any) {
      console.error('Error creating rental:', error);
      setError(error.message || 'Greška pri kreiranju iznajmljivanja. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Novo iznajmljivanje
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vozilo <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Izaberite vozilo</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.registration_number} ({vehicle.daily_rate} KM/dan)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Klijent <span className="text-red-500">*</span>
              </label>
              {loadingClients ? (
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                  Učitavanje klijenata...
                </div>
              ) : clients.length === 0 ? (
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                  Nema dostupnih klijenata. Prvo dodajte klijente.
                </div>
              ) : (
                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Izaberite klijenta</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Datum početka <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Datum završetka <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {totalPrice > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm font-medium text-blue-900">
                  Ukupna cijena: <span className="text-xl">{totalPrice.toFixed(2)} KM</span>
                </p>
                {formData.vehicle_id && formData.start_date && formData.end_date && (
                  <p className="text-xs text-blue-700 mt-1">
                    {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} dana × {vehicles.find(v => v.id.toString() === formData.vehicle_id)?.daily_rate} KM
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading || loadingClients || clients.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Kreiranje...
                </>
              ) : (
                'Kreiraj iznajmljivanje'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}