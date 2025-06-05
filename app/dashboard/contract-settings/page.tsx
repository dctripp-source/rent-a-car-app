// app/dashboard/contract-settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, FileText, Building2, Eye } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface ContractTemplate {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  contract_terms: string;
  penalty_rate: number;
  logo_url?: string;
  // Novi podaci
  jib_number?: string;
  bank_account?: string;
  owner_name?: string;
  contract_style: 'simple' | 'detailed' | 'jandra_style';
  include_km_fields: boolean;
  include_driver_license: boolean;
  include_id_details: boolean;
  fuel_policy?: string;
  additional_notes?: string;
}

const contractStyles = [
  { value: 'simple', label: 'Jednostavan ugovor', description: 'Osnovni ugovor sa minimalnim podacima' },
  { value: 'detailed', label: 'Detaljan ugovor', description: 'Ugovor sa dodatnim podacima o klijentu' },
  { value: 'jandra_style', label: 'Jandra Cars stil', description: 'Profesionalni ugovor sa svim detaljima' }
];

export default function ContractSettingsPage() {
  const { fetchWithAuth } = useApi();
  const [formData, setFormData] = useState<ContractTemplate>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    contract_terms: '',
    penalty_rate: 50.00,
    jib_number: '',
    bank_account: '',
    owner_name: '',
    contract_style: 'simple',
    include_km_fields: false,
    include_driver_license: false,
    include_id_details: false,
    fuel_policy: 'Vozilo se preuzima sa punim rezervoarom goriva, i korisnik treba da isti vrati pun prilikom vraćanja vozila.',
    additional_notes: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  useEffect(() => {
    // Auto-update fields based on contract style
    if (formData.contract_style === 'jandra_style') {
      setFormData(prev => ({
        ...prev,
        include_km_fields: true,
        include_driver_license: true,
        include_id_details: true,
        contract_terms: `Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.

The renter bears full material and criminal and misdemeanor responsibility for the vehicle and undertakes to pay for the resulting damages and traffic violations during the rental period.

U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od {penalty_rate}% dnevne cijene za svaki dan kašnjenja.`,
        fuel_policy: 'Napomena: vozilo se preuzima sa punim rezervoarom goriva, i korisnik treba da isti vrati pun prilikom vraćanja vozila. / Note: the vehicle is picked up with a full fuel tank, and the user should return it full when returning the vehicle.'
      }));
    } else if (formData.contract_style === 'detailed') {
      setFormData(prev => ({
        ...prev,
        include_driver_license: true,
        include_id_details: true
      }));
    }
  }, [formData.contract_style]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'penalty_rate' ? parseFloat(value) || 0 : value,
      }));
    }
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

  const handlePreview = async () => {
    // Implementirajte preview funkcionalnost
    setPreviewMode(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Podešavanje ugovora</h1>
        </div>
        <button
          onClick={handlePreview}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Eye className="h-4 w-4 mr-2" />
          Pregled ugovora
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leva kolona - Osnovne informacije */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Informacije o kompaniji
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stil ugovora <span className="text-red-500">*</span>
              </label>
              <select
                name="contract_style"
                value={formData.contract_style}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {contractStyles.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {contractStyles.find(s => s.value === formData.contract_style)?.description}
              </p>
            </div>

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
                  placeholder="JANDRA CARS s.p."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vlasnik/Direktor
                </label>
                <input
                  type="text"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Vl Desanka Jandrić"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JIB broj
                </label>
                <input
                  type="text"
                  name="jib_number"
                  value={formData.jib_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="4512970750008"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Žiro račun
                </label>
                <input
                  type="text"
                  name="bank_account"
                  value={formData.bank_account}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="562-099-8180-8643-85"
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
                  placeholder="jandra.cars@gmail.com"
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
                  placeholder="+387 66 11 77 86"
                />
              </div>
            </div>

            <div>
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
                placeholder="Rade Kondića 6c, Banja Luka"
              />
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo kompanije</label>
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
                      <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {logoFile ? logoFile.name : 'Upload logo'}
                      </p>
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
          </form>
        </div>

        {/* Desna kolona - Uslovi i opcije */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uslovi ugovora i opcije</h2>
          
          <div className="space-y-4">
            {/* Contract options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Uključi u ugovor:</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="include_km_fields"
                    checked={formData.include_km_fields}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Početna/završna kilometraža</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="include_driver_license"
                    checked={formData.include_driver_license}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Podaci o vozačkoj dozvoli</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="include_id_details"
                    checked={formData.include_id_details}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Detaljni podaci o ličnoj karti</span>
                </label>
              </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Politika goriva
              </label>
              <textarea
                name="fuel_policy"
                value={formData.fuel_policy}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Napomena o politici goriva..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uslovi ugovora
              </label>
              <textarea
                name="contract_terms"
                value={formData.contract_terms}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unesite uslove i odredbe ugovora..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Koristite <code>{'{penalty_rate}'}</code> za dinamičko ubacivanje procenta penala.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dodatne napomene
              </label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dodatne napomene ili instrukcije..."
              />
            </div>

            {/* Submit button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </div>
  );
}