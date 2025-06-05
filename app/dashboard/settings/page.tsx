// app/dashboard/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, FileText, Building, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface CompanySettings {
  company_name: string;
  contact_person: string;
  address: string;
  phone: string;
  email: string;
  jib: string;
  bank_account: string;
}

export default function SettingsPage() {
  const { fetchWithAuth } = useApi();
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    contact_person: '',
    address: '',
    phone: '',
    email: '',
    jib: '',
    bank_account: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setError('');
      const response = await fetchWithAuth('/api/settings/company');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }

      const data = await response.json();
      console.log('Loaded settings:', data);
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      setError(error.message || 'Greška pri učitavanju podešavanja');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      console.log('Saving settings:', settings);
      
      const response = await fetchWithAuth('/api/settings/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri čuvanju podešavanja');
      }

      console.log('Settings saved:', data);
      setSuccess('Podešavanja su uspešno sačuvana!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Greška pri čuvanju podešavanja');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Podešavanja ugovora</h1>
        <div className="flex items-center text-sm text-gray-500">
          <FileText className="h-4 w-4 mr-2" />
          Podaci koji će se prikazati na ugovorima
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Podaci o firmi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Ovi podaci će biti prikazani u header-u svakog ugovora
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-500 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Naziv firme */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Naziv firme <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="JANDRA CARS s.p."
              />
            </div>

            {/* Kontakt osoba */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Kontakt osoba
              </label>
              <input
                type="text"
                name="contact_person"
                value={settings.contact_person}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Desanka Jandrić"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="+387 66 11 77 86"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={settings.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="info@firma.com"
              />
            </div>

            {/* JIB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                JIB <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="jib"
                value={settings.jib}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="4512970750008"
              />
            </div>

            {/* Adresa */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Adresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rade Kondića 6c, Prijedor"
              />
            </div>

            {/* Žiro račun */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Žiro račun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_account"
                value={settings.bank_account}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="562-099-8180-8643-85"
              />
            </div>
          </div>

          {/* Preview sekcija */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pregled kako će izgledati na ugovoru:</h3>
            <div className="flex justify-between items-start">
              <div className="text-sm">
                <div className="font-bold">{settings.company_name || 'NAZIV FIRME'}</div>
                <div>{settings.contact_person || 'Kontakt osoba'}</div>
                <div>{settings.address || 'Adresa firme'}</div>
                <div>Tel: {settings.phone || '+387 XX XXX XXX'}</div>
                <div>Email: {settings.email || 'email@firma.com'}</div>
              </div>
              <div className="text-sm text-right">
                <div className="font-bold">JIB: {settings.jib || 'XXXXXXXXX'}</div>
                <div className="font-bold">Žiro račun: {settings.bank_account || 'XXX-XXX-XXXX-XXX'}</div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6 flex justify-end">
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
                  Sačuvaj podešavanja
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}