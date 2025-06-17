// components/VehicleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { Vehicle } from '@/types';
import { useApi } from '@/hooks/useApi';
import { ImageOptimizer } from '@/lib/image-optimizer';


interface VehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export default function VehicleModal({ vehicle, onClose }: VehicleModalProps) {
  const { fetchWithAuth } = useApi();
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    registration_number: '',
    daily_rate: 0,
    status: 'available' as Vehicle['status'],
    fuel_type: 'gasoline' as 'gasoline' | 'diesel' | 'hybrid' | 'electric',
    transmission: 'manual' as 'manual' | 'automatic',
    seat_count: 5,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageOptimizing, setImageOptimizing] = useState(false);
  const [imageStats, setImageStats] = useState<{
    originalSize: number;
    optimizedSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        registration_number: vehicle.registration_number,
        daily_rate: vehicle.daily_rate,
        status: vehicle.status,
        fuel_type: (vehicle as any).fuel_type || 'gasoline',
        transmission: (vehicle as any).transmission || 'manual',
        seat_count: (vehicle as any).seat_count || 5,
      });
      
      if (vehicle.image_url) {
        setImagePreview(vehicle.image_url);
      }
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'daily_rate' || name === 'seat_count' ? Number(value) : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Molimo izaberite sliku');
        return;
      }
      
      // Check file size (max 10MB for original)
      if (file.size > 10 * 1024 * 1024) {
        setError('Slika mora biti manja od 10MB');
        return;
      }
      
      setOriginalImageFile(file);
      setError('');
      setImageOptimizing(true);

      try {
        // Check if optimization is needed
        const needsOptimization = ImageOptimizer.needsOptimization(file, 500);
        
        if (needsOptimization) {
          // Optimize the image
          const optimizedFile = await ImageOptimizer.optimizeImage(file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.85,
            targetSizeKB: 400,
            format: 'webp'
          });
          
          setImageFile(optimizedFile);
          setImageStats({
            originalSize: ImageOptimizer.getFileSizeKB(file),
            optimizedSize: ImageOptimizer.getFileSizeKB(optimizedFile)
          });
        } else {
          setImageFile(file);
          setImageStats({
            originalSize: ImageOptimizer.getFileSizeKB(file),
            optimizedSize: ImageOptimizer.getFileSizeKB(file)
          });
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(imageFile || file);
        
      } catch (error) {
        console.error('Error optimizing image:', error);
        setError('Greška pri optimizaciji slike. Pokušajte sa drugom slikom.');
      } finally {
        setImageOptimizing(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setOriginalImageFile(null);
    setImagePreview(vehicle?.image_url || '');
    setImageStats(null);
    // Reset file input
    const fileInput = document.getElementById('image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = vehicle 
        ? `/api/vehicles/${vehicle.id}`
        : '/api/vehicles';

      const response = await fetchWithAuth(url, {
        method: vehicle ? 'PUT' : 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri čuvanju vozila');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      setError(error.message || 'Greška pri čuvanju vozila. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {vehicle ? 'Izmjeni vozilo' : 'Dodaj novo vozilo'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leva kolona - osnovne informacije */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Marka <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="npr. Toyota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="npr. Corolla"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Godina <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Broj sjedišta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="seat_count"
                    value={formData.seat_count}
                    onChange={handleChange}
                    min="2"
                    max="20"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registarski broj <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="npr. PD-123-AB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cijena po danu (KM) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="daily_rate"
                  value={formData.daily_rate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tip goriva <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gasoline">Benzin</option>
                    <option value="diesel">Dizel</option>
                    <option value="hybrid">Hibrid</option>
                    <option value="electric">Električni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Transmisija <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="manual">Manuelna</option>
                    <option value="automatic">Automatska</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Dostupno</option>
                  <option value="rented">Iznajmljeno</option>
                  <option value="maintenance">Održavanje</option>
                  <option value="broken">Pokvareno</option>
                </select>
              </div>
            </div>

            {/* Desna kolona - slika */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slika vozila
                </label>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Ukloni sliku
                    </button>
                  </div>
                )}

                {/* Upload Area */}
                <div className="relative">
                  <label className="cursor-pointer">
                    <div className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                      imageOptimizing 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {imageOptimizing ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                          <p className="mt-2 text-sm text-blue-600">
                            Optimizacija slike...
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          {imageFile ? (
                            <ImageIcon className="mx-auto h-12 w-12 text-green-500" />
                          ) : (
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          )}
                          <p className="mt-2 text-sm text-gray-600">
                            {imageFile 
                              ? `Izabrano: ${imageFile.name}` 
                              : 'Kliknite za upload slike'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={imageOptimizing}
                    />
                  </label>
                </div>

                {/* Image Stats */}
                {imageStats && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <div className="text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Originalna veličina:</span>
                        <span>{imageStats.originalSize} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimizovana veličina:</span>
                        <span>{imageStats.optimizedSize} KB</span>
                      </div>
                      {imageStats.originalSize > imageStats.optimizedSize && (
                        <div className="flex justify-between font-medium">
                          <span>Ušteđeno:</span>
                          <span>
                            {Math.round(((imageStats.originalSize - imageStats.optimizedSize) / imageStats.originalSize) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Guidelines */}
                <div className="text-xs text-gray-500 mt-2">
                  <p>• Maksimalna veličina: 10MB</p>
                  <p>• Slike će biti automatski optimizovane za web</p>
                  <p>• Preporučeni formati: JPG, PNG, WebP</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading || imageOptimizing}
            >
              Otkaži
            </button>
            <button
              type="submit"
              disabled={loading || imageOptimizing}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Čuvanje...
                </>
              ) : (
                vehicle ? 'Izmjeni' : 'Dodaj'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}