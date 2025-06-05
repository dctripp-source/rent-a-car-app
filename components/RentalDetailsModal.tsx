// components/RentalDetailsModal.tsx - Kompletna verzija
'use client';

import { useState } from 'react';
import { X, Calendar, User, Car, Download, Plus, Play, XCircle, Clock } from 'lucide-react';
import { Rental } from '@/types';
import { format } from 'date-fns';
import { useApi } from '@/hooks/useApi';

interface RentalDetailsModalProps {
  rental: Rental;
  onClose: () => void;
}

export default function RentalDetailsModal({ rental, onClose }: RentalDetailsModalProps) {
  const { fetchWithAuth } = useApi();
  const [showExtension, setShowExtension] = useState(false);
  const [extensionDays, setExtensionDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');

  const extensionPrice = extensionDays * (rental.vehicle?.daily_rate || 0);
  const newEndDate = new Date(rental.end_date);
  newEndDate.setDate(newEndDate.getDate() + extensionDays);

  const isReservation = rental.status === 'reserved';
  // Ispravka: koristimo start_date i end_date umjesto start_datetime i end_datetime
  const hasDateTime = rental.start_date && rental.end_date;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy HH:mm');
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

  const handleActivateReservation = async () => {
    if (!confirm('Da li ste sigurni da želite aktivirati ovu rezervaciju?')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/reservations/${rental.id}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri aktivaciji rezervacije');
      }

      onClose();
    } catch (error: any) {
      console.error('Error activating reservation:', error);
      setError(error.message || 'Greška pri aktivaciji rezervacije');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!confirm('Da li ste sigurni da želite otkazati ovu rezervaciju?')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetchWithAuth(`/api/reservations/${rental.id}/cancel`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri otkazivanju rezervacije');
      }

      onClose();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      setError(error.message || 'Greška pri otkazivanju rezervacije');
    } finally {
      setLoading(false);
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
  };

  const getStatusInfo = () => {
    switch (rental.status) {
      case 'reserved':
        return {
          label: 'Rezervisano',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        };
      case 'active':
        return {
          label: 'Aktivno',
          color: 'bg-green-100 text-green-800',
          icon: Play
        };
      case 'completed':
        return {
          label: 'Završeno',
          color: 'bg-gray-100 text-gray-800',
          icon: Calendar
        };
      case 'cancelled':
        return {
          label: 'Otkazano',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        };
      default:
        return {
          label: rental.status,
          color: 'bg-gray-100 text-gray-800',
          icon: Calendar
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <StatusIcon className="h-6 w-6 mr-2 text-gray-600" />
            {isReservation ? 'Detalji rezervacije' : 'Detalji iznajmljivanja'}
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

        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Car className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold">Vozilo</h3>
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

          {/* Period Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="font-semibold">
                {isReservation ? 'Period rezervacije' : 'Period iznajmljivanja'}
              </h3>
            </div>
            
            {/* Ispravka: koristimo start_date i end_date */}
            <p className="text-sm">
              Od: <span className="font-medium">{format(new Date(rental.start_date), 'dd.MM.yyyy')}</span>
            </p>
            <p className="text-sm">
              Do: <span className="font-medium">{format(new Date(rental.end_date), 'dd.MM.yyyy')}</span>
            </p>
            
            <p className="text-sm mt-2">
              Status: 
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </p>
          </div>

          {/* Notes for reservations - dodajemo check za notes polje */}
          {(rental as any).notes && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Napomene</h3>
              <p className="text-sm text-gray-700">{(rental as any).notes}</p>
            </div>
          )}

          {/* Price */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cijena</h3>
            <p className="text-2xl font-bold text-blue-900">
              {(typeof rental.total_price === 'number' ? rental.total_price : parseFloat(rental.total_price)).toFixed(2)} KM
            </p>
          </div>

          {/* Extension Section - only for active rentals */}
          {rental.status === 'active' && !showExtension && (
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
          <div className="flex flex-col space-y-3">
            {/* Reservation specific actions */}
            {isReservation && (
              <div className="flex space-x-3">
                <button
                  onClick={handleActivateReservation}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {loading ? 'Aktiviranje...' : 'Aktiviraj rezervaciju'}
                </button>
                
                <button
                  onClick={handleCancelReservation}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  {loading ? 'Otkazivanje...' : 'Otkaži rezervaciju'}
                </button>
              </div>
            )}

            {/* Standard actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleGeneratePDF}
                disabled={downloadingPdf}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Generisanje...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Generiši ugovor (PDF)
                  </>
                )}
              </button>
              
              {rental.status === 'active' && (
                <button
                  onClick={handleCompleteRental}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Završavanje...' : 'Završi iznajmljivanje'}
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}