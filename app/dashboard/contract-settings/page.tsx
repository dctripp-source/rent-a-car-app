// app/dashboard/contract-settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, FileText, Building2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface ContractTemplate {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  contract_terms: string;
  penalty_rate: number;
  logo_url?: string;
}

export default function ContractSettingsPage() {
  const { fetchWithAuth } = useApi();
  const [formData, setFormData] = useState<ContractTemplate>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    contract_terms: `Klijent se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja i da će ga vratiti u istom stanju u kojem ga je preuzeo. 
Klijent snosi punu odgovornost za sve štete nastale tokom perioda iznajmljivanja. 
U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od {penalty_rate}% dnevne cijene za svaki dan kašnjenja.

Dodatni uslovi:
- Vozilo se preuzima sa punim rezervoarom i vraća sa punim rezervoarom
- Zabranjeno je pušenje u vozilu
- Zabranjeno je prevoz kućnih ljubimaca bez prethodnog odobrenja
- Maksimalna dozvoljena brzina je ograničena na 130 km/h na autoputu`,
    penalty_rate: 50.00,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setError('');
      const response = await fetchWithAuth('/api/contract-template');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch template');
      }

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        ...data
      }));
    } catch (error: any) {
      console.error('Error fetching template:', error);
      setError(error.message || 'Greška pri učitavanju template-a');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'penalty_rate' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        setError('Molimo izaberite sliku za logo');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo mora biti manji od 2MB');
        return;
      }
      
      setLogoFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const response = await fetchWithAuth('/api/contract-template', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri čuvanju template-a');
      }

      setSuccess('Template ugovora je uspješno sačuvan!');
      setLogoFile(null);
      
      fetchTemplate();
    } catch (error: any) {
      console.error('Error saving template:', error);
      setError(error.message || 'Greška pri čuvanju template-a. Pokušajte ponovo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <FileText className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Podešavanje ugovora</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-500 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Informacije o kompaniji
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naziv kompanije <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Novera Rent d.o.o."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email kompanije
                </label>
                <input
                  type="email"
                  name="company_email"
                  value={formData.company_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="info@noverarent.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon kompanije
                </label>
                <input
                  type="tel"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+387 52 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procenat penala za kašnjenje (%)
                </label>
                <input
                  type="number"
                  name="penalty_rate"
                  value={formData.penalty_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresa kompanije <span className="text-red-500">*</span>
              </label>
              <textarea
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ulica i broj, Grad, Poštanski broj, Zemlja"
              />
            </div>
          </div>

          {/* Logo */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logo kompanije</h2>
            
            <div className="flex items-center space-x-4">
              {formData.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={formData.logo_url}
                    alt="Company Logo"
                    className="h-16 w-16 object-contain border border-gray-300 rounded"
                  />
                </div>
              )}
              
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {logoFile ? logoFile.name : 'Kliknite za upload logo-a'}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG max 2MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Uslovi ugovora</h2>
            <p className="text-sm text-gray-600 mb-2">
              Možete koristiti <code>{'{penalty_rate}'}</code> da dinamički ubacite procenat penala.
            </p>
            
            <textarea
              name="contract_terms"
              value={formData.contract_terms}
              onChange={handleChange}
              required
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Unesite uslove i odredbe ugovora..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Čuvanje...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sačuvaj template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}