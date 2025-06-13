// app/dashboard/clients/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, User, CreditCard, Car, Hash } from 'lucide-react';
import { Client } from '@/types';
import ClientModal from '@/components/ClientModal';
import { useApi } from '@/hooks/useApi';

export default function ClientsPage() {
  const { fetchWithAuth } = useApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setError('');
      const response = await fetchWithAuth('/api/clients');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
      }

      const data = await response.json();
      console.log('Fetched clients:', data); // Debug log
      setClients(data);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      setError(error.message || 'Greška pri učitavanju klijenata');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovog klijenta?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }

      // Refresh lista
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      alert(error.message || 'Greška pri brisanju klijenta');
    }
  };

  const handleEdit = (client: Client) => {
    console.log('Editing client:', client); // Debug log
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    fetchClients();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('sr-RS');
  };

  const isExpiringSoon = (dateString: string | undefined, daysThreshold: number = 30) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= daysThreshold && diffDays >= 0;
  };

  const isExpired = (dateString: string | undefined) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    return expiryDate < today;
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
            onClick={fetchClients}
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
        <h1 className="text-2xl font-bold text-gray-900">Klijenti</h1>
        <button
          onClick={handleAdd}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Dodaj klijenta
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Nemate dodanih klijenata</p>
          <button
            onClick={handleAdd}
            className="text-blue-600 hover:text-blue-700"
          >
            Dodajte prvog klijenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Izmjeni"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Obriši"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                {/* Osnovni kontakt */}
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Lična karta */}
                {(client.id_number || client.jmbg || client.id_card_valid_until) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium text-gray-800">Lična karta</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {client.id_number && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Broj:</span> {client.id_number}
                        </div>
                      )}
                      {client.jmbg && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Hash className="h-3 w-3 mr-1" />
                          <span className="font-medium">JMBG:</span> {client.jmbg}
                        </div>
                      )}
                      {client.id_card_valid_until && (
                        <div className={`text-xs ${
                          isExpired(client.id_card_valid_until) 
                            ? 'text-red-600 font-medium' 
                            : isExpiringSoon(client.id_card_valid_until)
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Vrijedi do:</span> {formatDate(client.id_card_valid_until)}
                          {isExpired(client.id_card_valid_until) && <span className="ml-1">(ISTEKLA)</span>}
                          {isExpiringSoon(client.id_card_valid_until) && !isExpired(client.id_card_valid_until) && <span className="ml-1">(ISTIČE USKORO)</span>}
                        </div>
                      )}
                      {client.id_card_issued_by && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Izdata od:</span> {client.id_card_issued_by}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vozačka dozvola */}
                {(client.driving_license_number || client.driving_license_valid_until) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <Car className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-medium text-gray-800">Vozačka dozvola</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {client.driving_license_number && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Broj:</span> {client.driving_license_number}
                        </div>
                      )}
                      {client.driving_license_valid_until && (
                        <div className={`text-xs ${
                          isExpired(client.driving_license_valid_until) 
                            ? 'text-red-600 font-medium' 
                            : isExpiringSoon(client.driving_license_valid_until)
                            ? 'text-orange-600 font-medium'
                            : 'text-gray-600'
                        }`}>
                          <span className="font-medium">Vrijedi do:</span> {formatDate(client.driving_license_valid_until)}
                          {isExpired(client.driving_license_valid_until) && <span className="ml-1">(ISTEKLA)</span>}
                          {isExpiringSoon(client.driving_license_valid_until) && !isExpired(client.driving_license_valid_until) && <span className="ml-1">(ISTIČE USKORO)</span>}
                        </div>
                      )}
                      {client.driving_license_issued_by && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Izdata od:</span> {client.driving_license_issued_by}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ClientModal
          client={selectedClient}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}