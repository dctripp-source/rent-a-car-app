// app/dashboard/clients/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
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
            <div key={client.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {client.phone}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="break-words">{client.address}</span>
                  </div>
                )}
                {client.id_number && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="font-medium">Broj LK:</span> {client.id_number}
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