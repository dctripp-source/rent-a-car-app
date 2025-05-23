// components/RentalDetailsModal.tsx
'use client';

import { useState } from 'react';
import { X, Calendar, User, Car, Download, Plus } from 'lucide-react';
import { Rental } from '@/types';
import { format } from 'date-fns';

interface RentalDetailsModalProps {
  rental: Rental;
  onClose: () => void;
}

export default function RentalDetailsModal({ rental, onClose }: RentalDetailsModalProps) {
  const [showExtension, setShowExtension] = useState(false);
  const [extensionDays, setExtensionDays] = useState(1);
  const [loading, setLoading] = useState(false);

  const extensionPrice = extensionDays * (rental.vehicle?.daily_rate || 0);
  const newEndDate = new Date(rental.end_date);
  newEndDate.setDate(newEndDate.getDate() + extensionDays);

  const handleExtend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rentals/${rental.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extension_days: extensionDays,
          extension_price: extensionPrice,
        }),
      });

      if (response.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error extending rental:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`/api/rentals/${rental.id}/contract`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ugovor-${rental.id}.pdf`;
      a.click();
    } catch (error) {
      console.error('Error generating PDF:', error);
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
            {rental.client?.id_number && (
              <p className="text-sm text-gray-600">Broj LK: {rental.client?.id_number}</p>
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
                  : 'bg-red-100 text-red-800'
              }`}>
                {rental.status === 'active' ? 'Aktivno' : 
                 rental.status === 'completed' ? 'Završeno' : 'Otkazano'}
              </span>
            </p>
          </div>

          {/* Price */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cijena</h3>
            <p className="text-2xl font-bold text-blue-900">
              {rental.total_price.toFixed(2)} KM
            </p>
          </div>

          {/* Extension Section */}
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
                    Nova ukupna cijena: {(rental.total_price + extensionPrice).toFixed(2)} KM
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleExtend}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Produžavanje...' : 'Potvrdi produženje'}
                  </button>
                  <button
                    onClick={() => setShowExtension(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleGeneratePDF}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-5 w-5 mr-2" />
              Generiši ugovor (PDF)
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}