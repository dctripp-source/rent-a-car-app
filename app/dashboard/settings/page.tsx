// app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, Building, Mail, Phone, MapPin, FileText, CreditCard, Hash, User } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface CompanySettings {
  company_name: string;
  contact_person: string;
  address: string;
  phone: string;
  email: string;
  jib: string;
  bank_account: string;
  terms_and_conditions: string;
}

export default function SettingsPage() {
  const { fetchWithAuth } = useApi();
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'NOVERA RENT d.o.o.',
    contact_person: 'Desanka Jandrić',
    address: 'Rade Kondića 6c, Prijedor',
    phone: '+387 66 11 77 86',
    email: 'novera.rent@gmail.com',
    jib: '4512970750008',
    bank_account: '562-099-8180-8643-85',
    terms_and_conditions: `Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.

The renter bears full material and criminal and misdemeanor responsibility for the vehicle and undertakes to pay for the resulting damages and traffic violations during the rental period.

Vozilo mora biti vraćeno u istom stanju u kojem je preuzeto. U slučaju kašnjenja sa vraćanjem vozila, korisnik je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.

Korisnik se obavezuje da neće koristiti vozilo za prevoz opasnih materija, za taksi usluge ili bilo koje komercijalne aktivnosti bez prethodne pisane saglasnosti iznajmljivača.`
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.log('No existing settings found, using defaults');
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
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
    
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetchWithAuth('/api/settings', {
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

      setSuccessMessage('Podešavanja su uspješno sačuvana!');
      
      // Očisti poruku nakon 3 sekunde
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Greška pri čuvanju podešavanja. Pokušajte ponovo.');
    } finally {
      setSaveLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Podešavanja</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Osnovni podaci o kompaniji */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Podaci o kompaniji</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naziv kompanije <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Naziv vaše kompanije"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontakt osoba
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="contact_person"
                  value={settings.contact_person}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ime i prezime kontakt osobe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ulica, Grad"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+387 xx xxx xxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@kompanija.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JIB broj
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="jib"
                  value={settings.jib}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="JIB broj"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Žiro račun
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="bank_account"
                  value={settings.bank_account}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="xxx-xxx-xxxx-xxxx-xx"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Uslovi ugovora */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Uslovi ugovora</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tekst uslova koji će se prikazati u PDF ugovoru <span className="text-red-500">*</span>
            </label>
            <textarea
              name="terms_and_conditions"
              value={settings.terms_and_conditions}
              onChange={handleChange}
              required
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Unesite uslove ugovora koji će se prikazati u PDF dokumentu..."
            />
            <div className="mt-3 text-sm text-gray-500 space-y-1">
              <p>• Ovaj tekst će biti prikazan u sekciji "Uslovi ugovora" u PDF ugovoru.</p>
              <p>• Možete koristiti više redova za bolje formatiranje.</p>
              <p>• Srpska slova (č, ć, š, đ, ž) će biti podržana u PDF-u.</p>
              <p>• Preporučuje se da tekst bude kratak i jasan radi boljeg formatiranja.</p>
            </div>
          </div>
        </div>

        {/* Dugme za čuvanje */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Čuvanje...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Sačuvaj podešavanja
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}