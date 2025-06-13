// components/ClientModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Car } from 'lucide-react';
import { Client } from '@/types';
import { useApi } from '@/hooks/useApi';

interface ClientModalProps {
  client: Client | null;
  onClose: () => void;
}

export default function ClientModal({ client, onClose }: ClientModalProps) {
  const { fetchWithAuth } = useApi();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    id_number: '',
    jmbg: '',
    driving_license_number: '',
    id_card_issue_date: '',
    id_card_valid_until: '',
    id_card_issued_by: '',
    driving_license_issue_date: '',
    driving_license_valid_until: '',
    driving_license_issued_by: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      console.log('Loading client data:', client); // Debug log
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        id_number: client.id_number || '',
        jmbg: client.jmbg || '',
        driving_license_number: client.driving_license_number || '',
        id_card_issue_date: client.id_card_issue_date || '',
        id_card_valid_until: client.id_card_valid_until || '',
        id_card_issued_by: client.id_card_issued_by || '',
        driving_license_issue_date: client.driving_license_issue_date || '',
        driving_license_valid_until: client.driving_license_valid_until || '',
        driving_license_issued_by: client.driving_license_issued_by || '',
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      console.log('Submitting form data:', formData); // Debug log
      
      const url = client 
        ? `/api/clients/${client.id}`
        : '/api/clients';

      const response = await fetchWithAuth(url, {
        method: client ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri čuvanju klijenta');
      }

      console.log('Response data:', data); // Debug log
      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error.message || 'Greška pri čuvanju klijenta. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {client ? 'Izmjeni klijenta' : 'Dodaj novog klijenta'}
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

          <div className="space-y-6">
            {/* Osnovni podaci */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Osnovni podaci</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ime i prezime <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Petar Petrović"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+387 65 123 456"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Adresa
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ulica i broj, Grad, Poštanski broj"
                  />
                </div>
              </div>
            </div>

            {/* Lična karta */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Lična karta</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Broj lične karte
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    JMBG
                  </label>
                  <input
                    type="text"
                    name="jmbg"
                    value={formData.jmbg}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1234567890123"
                    maxLength={13}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Datum izdavanja LK
                  </label>
                  <input
                    type="date"
                    name="id_card_issue_date"
                    value={formData.id_card_issue_date}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vrijedi do
                  </label>
                  <input
                    type="date"
                    name="id_card_valid_until"
                    value={formData.id_card_valid_until}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Izdata od
                  </label>
                  <input
                    type="text"
                    name="id_card_issued_by"
                    value={formData.id_card_issued_by}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="MUP RS Prijedor"
                  />
                </div>
              </div>
            </div>

            {/* Vozačka dozvola */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <Car className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Vozačka dozvola</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Broj vozačke dozvole
                  </label>
                  <input
                    type="text"
                    name="driving_license_number"
                    value={formData.driving_license_number}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Datum izdavanja VD
                  </label>
                  <input
                    type="date"
                    name="driving_license_issue_date"
                    value={formData.driving_license_issue_date}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vrijedi do
                  </label>
                  <input
                    type="date"
                    name="driving_license_valid_until"
                    value={formData.driving_license_valid_until}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Izdata od
                  </label>
                  <input
                    type="text"
                    name="driving_license_issued_by"
                    value={formData.driving_license_issued_by}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="MUP RS Prijedor"
                  />
                </div>
              </div>
            </div>
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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Čuvanje...
                </>
              ) : (
                client ? 'Izmjeni' : 'Dodaj'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}