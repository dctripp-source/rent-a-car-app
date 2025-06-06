// lib/pdf-generator.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Registruj font iz public foldera
Font.register({
  family: 'DejaVuSans',
  fonts: [
    {
      src: 'https://raw.githubusercontent.com/dctripp-source/novera-fonts/main/DejaVuSans.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://raw.githubusercontent.com/dctripp-source/novera-fonts/main/DejaVuSans-Bold.ttf',
      fontWeight: 'bold',
    },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'DejaVuSans', // Koristi custom font
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 15,
  },
  companyInfo: {
    flex: 1,
    maxWidth: '60%',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  companyDetails: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  rightHeader: {
    textAlign: 'right',
    fontSize: 9,
    maxWidth: '35%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  contractNumber: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  infoGrid: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  infoRowFull: {
    flexDirection: 'row',
    marginBottom: 3,
    width: '100%',
  },
  labelLeft: {
    width: 110,
    fontWeight: 'bold',
    fontSize: 9,
    marginRight: 5,
  },
  valueLeft: {
    width: 110,
    fontSize: 9,
    marginRight: 10,
  },
  labelRight: {
    width: 110,
    fontWeight: 'bold',
    fontSize: 9,
    marginRight: 5,
  },
  valueRight: {
    flex: 1,
    fontSize: 9,
  },
  labelFull: {
    width: 110,
    fontWeight: 'bold',
    fontSize: 9,
    marginRight: 5,
  },
  valueFull: {
    flex: 1,
    fontSize: 9,
  },
  priceSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  priceLabel: {
    fontSize: 10,
  },
  priceValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 6,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  terms: {
    marginTop: 20,
    fontSize: 8,
    textAlign: 'justify',
    lineHeight: 1.2,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 35,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 35,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
  },
});

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

interface ContractData {
  id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  daily_rate: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_address?: string;
  client_id_number?: string;
  driving_license_number?: string;
  id_card_issue_date?: string;
  id_card_valid_until?: string;
  id_card_issued_by?: string;
  driving_license_issue_date?: string;
  driving_license_valid_until?: string;
  driving_license_issued_by?: string;
  company?: CompanySettings;
}

const ContractDocument: React.FC<{ data: ContractData }> = ({ data }) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const company = data.company || {
    company_name: 'Naziv kompanije',
    contact_person: 'Ime Prezime',
    address: 'Ulica, Grad',
    phone: '+387 66 123 456',
    email: 'email@email.com',
    jib: '0000000000000',
    bank_account: '000-000-0000-0000-00',
    terms_and_conditions: 'Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom, te se obavezuje platiti nastala oštećenja i saobraćajne prekršaje u periodu trajanja najma.',
  };

  const formatDateSafe = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.company_name}</Text>
            <Text style={styles.companyDetails}>
              {company.contact_person}{'\n'}
              {company.address}{'\n'}
              Tel: {company.phone}{'\n'}
              Email: {company.email}
            </Text>
          </View>
          <View style={styles.rightHeader}>
            <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>JIB: {company.jib}</Text>
            <Text style={{ fontWeight: 'bold' }}>Žiro račun: {company.bank_account}</Text>
          </View>
        </View>

        {/* Naslov */}
        <Text style={styles.title}>UGOVOR O IZNAJMLJIVANJU VOZILA</Text>
        <Text style={styles.contractNumber}>Broj: {String(data.id).padStart(3, '0')}/{new Date().getFullYear()}</Text>

        {/* Podaci o korisniku */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O KORISNIKU:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Ime i prezime:</Text>
              <Text style={styles.valueLeft}>{data.client_name}</Text>
              <Text style={styles.labelRight}>Telefon:</Text>
              <Text style={styles.valueRight}>{data.client_phone || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Br. lične karte:</Text>
              <Text style={styles.valueLeft}>{data.client_id_number || 'N/A'}</Text>
              <Text style={styles.labelRight}>Datum izdavanja:</Text>
              <Text style={styles.valueRight}>{formatDateSafe(data.id_card_issue_date)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Vrijedi do:</Text>
              <Text style={styles.valueLeft}>{formatDateSafe(data.id_card_valid_until)}</Text>
              <Text style={styles.labelRight}>Izdato od:</Text>
              <Text style={styles.valueRight}>{data.id_card_issued_by || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Br. vozačke dozvole:</Text>
              <Text style={styles.valueLeft}>{data.driving_license_number || 'N/A'}</Text>
              <Text style={styles.labelRight}>Datum izdavanja:</Text>
              <Text style={styles.valueRight}>{formatDateSafe(data.driving_license_issue_date)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Vrijedi do:</Text>
              <Text style={styles.valueLeft}>{formatDateSafe(data.driving_license_valid_until)}</Text>
              <Text style={styles.labelRight}>Izdato od:</Text>
              <Text style={styles.valueRight}>{data.driving_license_issued_by || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRowFull}>
              <Text style={styles.labelFull}>Adresa:</Text>
              <Text style={styles.valueFull}>{data.client_address || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Podaci o vozilu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PODACI O VOZILU:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Vozilo:</Text>
              <Text style={styles.valueLeft}>{data.brand} {data.model} ({data.year})</Text>
              <Text style={styles.labelRight}>Registracija:</Text>
              <Text style={styles.valueRight}>{data.registration_number}</Text>
            </View>
          </View>
        </View>

        {/* Period iznajmljivanja */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERIOD IZNAJMLJIVANJA:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Datum početka:</Text>
              <Text style={styles.valueLeft}>{format(startDate, 'dd.MM.yyyy')}</Text>
              <Text style={styles.labelRight}>Datum završetka:</Text>
              <Text style={styles.valueRight}>{format(endDate, 'dd.MM.yyyy')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.labelLeft}>Broj dana:</Text>
              <Text style={styles.valueLeft}>{days}</Text>
              <Text style={styles.labelRight}>Cijena/dan:</Text>
              <Text style={styles.valueRight}>{data.daily_rate.toFixed(2)} KM</Text>
            </View>
          </View>
        </View>

        {/* Cijena */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Cijena po danu:</Text>
            <Text style={styles.priceValue}>{data.daily_rate.toFixed(2)} KM</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Broj dana:</Text>
            <Text style={styles.priceValue}>{days}</Text>
          </View>
          <View style={styles.totalPrice}>
            <Text style={styles.totalLabel}>UKUPNA CIJENA:</Text>
            <Text style={styles.totalValue}>{data.total_price.toFixed(2)} KM</Text>
          </View>
        </View>

        {/* Uslovi ugovora */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>USLOVI UGOVORA:</Text>
          <Text>{company.terms_and_conditions}</Text>
        </View>

        {/* Potpisi */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>IZNAJMLJIVAČ</Text>
            <Text style={{ fontSize: 8, marginTop: 3 }}>{company.company_name}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>KORISNIK</Text>
            <Text style={{ fontSize: 8, marginTop: 3 }}>{data.client_name}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Datum: {format(new Date(), 'dd.MM.yyyy')} | Mjesto: {company.address}
        </Text>
      </Page>
    </Document>
  );
};

export async function generateContract(contractData: ContractData): Promise<Buffer> {
  try {
    console.log('=== PDF GENERATION START ===');
    
    const doc = <ContractDocument data={contractData} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const buffer = await blob.arrayBuffer();
    
    console.log('PDF generated successfully, size:', buffer.byteLength);
    return Buffer.from(buffer);
  } catch (error: unknown) {
    console.error('=== PDF GENERATION ERROR ===');
    console.error('Error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : 'Unknown PDF generation error';
      
    throw new Error(`PDF generation failed: ${errorMessage}`);
  }
}