// components/RentalDetailsModal.tsx - Kompletna verzija sa svim funkcijama
'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, Car, Download, Plus, Edit2, RefreshCw, Save, Trash2, AlertTriangle } from 'lucide-react';
import { Rental, Vehicle } from '@/types';
import { format } from 'date-fns';
import { useApi } from '@/hooks/useApi';

interface RentalDetailsModalProps {
  rental: Rental;
  onClose: () => void;
}

export default function RentalDetailsModal({ rental, onClose }: RentalDetailsModalProps) {
  const { fetchWithAuth } = useApi();
  const [showExtension, setShowExtension] = useState(false);
  const [showVehicleChange, setShowVehicleChange] = useState(false);
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [extensionDays, setExtensionDays] = useState(1);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [notes, setNotes] = useState(rental.notes || '');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const extensionPrice = extensionDays * (rental.vehicle?.daily_rate || 0);
  const newEndDate = new Date(rental.end_date);
  newEndDate.setDate(newEndDate.getDate() + extensionDays);

  useEffect(() => {
    if (showVehicleChange) {
      fetchAvailableVehicles();
    }
  }, [showVehicleChange]);

  const fetchAvailableVehicles = async () => {
    try {
      const response = await fetchWithAuth('/api/vehicles');
      if (response.ok) {
        const vehicles = await response.json();
        // Filtriraj samo dostupna vozila i trenutno vozilo
        const available = vehicles.filter((v: Vehicle) => 
          v.status === 'available' || v.id === rental.vehicle_id
        );
        setAvailableVehicles(available);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleExtend = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/rentals/${rental.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extension_days: extensionDays,
          extension_price: extensionPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri produženju');
      }

      onClose();
    } catch (error: any) {
      console.error('Error extending rental:', error);
      setError(error.message || 'Greška pri produženju iznajmljivanja');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = async () => {
    if (!selectedVehicleId) {
      setError('Molimo izaberite vozilo');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/rentals/${rental.id}/change-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_vehicle_id: selectedVehicleId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri zamjeni vozila');
      }

      onClose();
    } catch (error: any) {
      console.error('Error changing vehicle:', error);
      setError(error.message || 'Greška pri zamjeni vozila');
    } finally {
      setLoading(false);
    }
  };

  const handleNotesUpdate = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/rentals/${rental.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri ažuriranju napomena');
      }

      setShowNotesEdit(false);
      onClose();
    } catch (error: any) {
      console.error('Error updating notes:', error);
      setError(error.message || 'Greška pri ažuriranju napomena');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/rentals/${rental.id}/delete`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri brisanju rezervacije');
      }

      onClose();
    } catch (error: any) {
      console.error('Error deleting rental:', error);
      setError(error.message || 'Greška pri brisanju rezervacije');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleGeneratePDF = async () => {
    setDownloadingPdf(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/rentals/${rental.id}/contract`);
      
      if (!response.ok) {
        throw new Error('Greška pri generisanju PDF-a');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ugovor-${rental.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setError('Greška pri generisanju ugovora');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCompleteRental = async () => {
    if (rental.status === 'reserved') {
      // Aktiviraj rezervaciju
      if (!confirm('Da li ste sigurni da želite aktivirati ovu rezervaciju?')) {
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const response = await fetchWithAuth(`/api/rentals/${rental.id}/activate`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Greška pri aktiviranju rezervacije');
        }

        onClose();
      } catch (error: any) {
        console.error('Error activating rental:', error);
        setError(error.message || 'Greška pri aktiviranju rezervacije');
      } finally {
        setLoading(false);
      }
    } else {
      // Završi rezervaciju
      if (!confirm('Da li ste sigurni da želite označiti ovo iznajmljivanje kao završeno?')) {
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const response = await fetchWithAuth(`/api/rentals/${rental.id}/complete`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Greška pri završetku iznajmljivanja');
        }

        onClose();
      } catch (error: any) {
        console.error('Error completing rental:', error);
        setError(error.message || 'Greška pri završetku iznajmljivanja');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Detalji iznajmljivanja
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">Potvrdi brisanje</h3>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Da li ste sigurni da želite obrisati ovu rezervaciju?
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">{rental.vehicle?.brand} {rental.vehicle?.model} - {rental.client?.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(rental.start_date), 'dd.MM.yyyy')} - {format(new Date(rental.end_date), 'dd.MM.yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {rental.status === 'active' ? 'Aktivno' : 
                             rental.status === 'completed' ? 'Završeno' : 
                             rental.status === 'reserved' ? 'Rezervisano' : 'Otkazano'}
                  </p>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  Ova akcija se ne može poništiti. {rental.status === 'active' ? 'Vozilo će biti vraćeno u status "dostupno".' : ''}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  disabled={deleting}
                >
                  Otkaži
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Brisanje...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Obriši rezervaciju
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Car className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-semibold">Vozilo</h3>
              </div>
              {rental.status === 'active' && (
                <button
                  onClick={() => setShowVehicleChange(!showVehicleChange)}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Zamijeni vozilo
                </button>
              )}
            </div>
            <p className="text-lg">
              {rental.vehicle?.brand} {rental.vehicle?.model} ({rental.vehicle?.year})
            </p>
            <p className="text-sm text-gray-600">
              Registracija: {rental.vehicle?.registration_number}
            </p>
            <p className="text-sm text-gray-600">
              Cijena po danu: {rental.vehicle?.daily_rate} KM
            </p>
          </div>

          {/* Vehicle Change Section */}
          {showVehicleChange && rental.status === 'active' && (
            <div className="border-2 border-blue-500 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Zamjena vozila</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Novo vozilo
                  </label>
                  <select
                    value={selectedVehicleId || ''}
                    onChange={(e) => setSelectedVehicleId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Izaberite vozilo</option>
                    {availableVehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.registration_number} 
                        {vehicle.id === rental.vehicle_id ? ' (trenutno)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleVehicleChange}
                    disabled={loading || !selectedVehicleId}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Zamjenjujem...' : 'Potvrdi zamjenu'}
                  </button>
                  <button
                    onClick={() => setShowVehicleChange(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    disabled={loading}
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold">Klijent</h3>
            </div>
            <p className="text-lg">{rental.client?.name}</p>
            <p className="text-sm text-gray-600">Email: {rental.client?.email}</p>
            {rental.client?.phone && (
              <p className="text-sm text-gray-600">Telefon: {rental.client?.phone}</p>
            )}
          </div>

          {/* Rental Period */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold">Period iznajmljivanja</h3>
            </div>
            <p className="text-sm">
              Od: <span className="font-medium">{format(new Date(rental.start_date), 'dd.MM.yyyy')}</span>
            </p>
            <p className="text-sm">
              Do: <span className="font-medium">{format(new Date(rental.end_date), 'dd.MM.yyyy')}</span>
            </p>
            <p className="text-sm mt-2">
              Status: 
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                rental.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : rental.status === 'completed'
                  ? 'bg-gray-100 text-gray-800'
                  : rental.status === 'reserved'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {rental.status === 'active' ? 'Aktivno' : 
                 rental.status === 'completed' ? 'Završeno' : 
                 rental.status === 'reserved' ? 'Rezervisano' : 'Otkazano'}
              </span>
            </p>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Napomene</h3>
              <button
                onClick={() => setShowNotesEdit(!showNotesEdit)}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                {showNotesEdit ? 'Otkaži' : 'Izmijeni'}
              </button>
            </div>
            {showNotesEdit ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dodajte napomene..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleNotesUpdate}
                    disabled={loading}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {loading ? 'Čuvanje...' : 'Sačuvaj'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNotesEdit(false);
                      setNotes(rental.notes || '');
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                    disabled={loading}
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {rental.notes || 'Nema napomena za ovo iznajmljivanje'}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cijena</h3>
            <p className="text-2xl font-bold text-blue-900">
              {(typeof rental.total_price === 'number' ? rental.total_price : parseFloat(rental.total_price)).toFixed(2)} KM
            </p>
          </div>

          {/* Extension Section */}
          {(rental.status === 'active' || rental.status === 'reserved') && !showExtension && (
            <button
              onClick={() => setShowExtension(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Produži iznajmljivanje
            </button>
          )}

          {showExtension && (
            <div className="border-2 border-green-500 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Produženje iznajmljivanja</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Broj dana za produženje (max 3)
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map(days => (
                      <button
                        key={days}
                        onClick={() => setExtensionDays(days)}
                        className={`px-4 py-2 rounded-md ${
                          extensionDays === days
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {days} {days === 1 ? 'dan' : 'dana'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    Novi datum završetka: <span className="font-medium">{format(newEndDate, 'dd.MM.yyyy')}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Cijena produženja: <span className="font-medium">{extensionPrice.toFixed(2)} KM</span>
                  </p>
                  <p className="text-lg font-semibold text-green-800 mt-2">
                    Nova ukupna cijena: {((typeof rental.total_price === 'number' ? rental.total_price : parseFloat(rental.total_price)) + extensionPrice).toFixed(2)} KM
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleExtend}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Produžavanje...' : 'Potvrdi produženje'}
                  </button>
                  <button
                    onClick={() => setShowExtension(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    disabled={loading}
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGeneratePDF}
              disabled={downloadingPdf}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Generisanje...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Generiši ugovor
                </>
              )}
            </button>
            
            {(rental.status === 'active' || rental.status === 'reserved') && (
              <button
                onClick={handleCompleteRental}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Obrađujem...' : 
                 rental.status === 'reserved' ? 'Aktiviraj rezervaciju' : 'Završi iznajmljivanje'}
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Obriši rezervaciju
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}