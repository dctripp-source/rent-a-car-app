// lib/pdf-generator.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Registruj font koji podržava srpske karaktere
Font.register({
  family: 'DejaVu',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/dejavu/v1/DejaVuSans.ttf',
    },
    {
      src: 'https://fonts.gstatic.com/s/dejavu/v1/DejaVuSans-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'DejaVu',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  rightHeader: {
    textAlign: 'right',
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  contractNumber: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 5,
    flexDirection: 'row',
  },
  infoItemFull: {
    width: '100%',
    marginBottom: 5,
    flexDirection: 'row',
  },
  label: {
    width: 120,
    fontWeight: 'bold',
    fontSize: 10,
  },
  value: {
    flex: 1,
    fontSize: 10,
  },
  priceSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  terms: {
    marginTop: 25,
    fontSize: 9,
    textAlign: 'justify',
    lineHeight: 1.3,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 40,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

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
}

const ContractDocument: React.FC<{ data: ContractData }> = ({ data }) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header sa kompanijskim podacima i JIB/žiro račun */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>NOVERA RENT d.o.o.</Text>
            <Text style={styles.companyDetails}>
              Desanka Jandrić{'\n'}
              Rade Kondića 6c, Prijedor{'\n'}
              Tel: +387 66 11 77 86{'\n'}
              Email: novera.rent@gmail.com
            </Text>
          </View>
          <View style={styles.rightHeader}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>JIB: 4512970750008</Text>
            <Text style={{ fontWeight: 'bold' }}>Žiro račun: 562-099-8180-8643-85</Text>
          </View>
        </View>

        {/* Naslov ugovora */}
        <Text style={styles.title}>Ugovor o iznajmljivanju vozila</Text>
        <Text style={styles.contractNumber}>Broj: {String(data.id).padStart(3, '0')}/{new Date().getFullYear()}</Text>

        {/* Podaci o klijentu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podaci o korisniku:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Ime i prezime:</Text>
              <Text style={styles.value}>{data.client_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={styles.value}>{data.client_phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoItemFull}>
              <Text style={styles.label}>Adresa:</Text>
              <Text style={styles.value}>{data.client_address || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.client_email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Broj lične karte:</Text>
              <Text style={styles.value}>{data.client_id_number || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Podaci o vozilu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podaci o vozilu:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Vozilo:</Text>
              <Text style={styles.value}>{data.brand} {data.model} ({data.year})</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Registarske oznake:</Text>
              <Text style={styles.value}>{data.registration_number}</Text>
            </View>
          </View>
        </View>

        {/* Period iznajmljivanja */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period iznajmljivanja:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Datum početka:</Text>
              <Text style={styles.value}>{format(startDate, 'dd.MM.yyyy')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Datum završetka:</Text>
              <Text style={styles.value}>{format(endDate, 'dd.MM.yyyy')}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Broj dana:</Text>
              <Text style={styles.value}>{days}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.label}>Cijena po danu:</Text>
              <Text style={styles.value}>{data.daily_rate.toFixed(2)} KM</Text>
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
          <Text>
            1. Korisnik preuzima vozilo u ispravnom stanju sa punim rezervoarom goriva i obavezuje se da ga vrati u istom stanju.{'\n\n'}
            2. Korisnik snosi punu materijalnu, krivičnu i prekršajnu odgovornost nad vozilom tokom perioda najma.{'\n\n'}
            3. U slučaju kašnjenja sa vraćanjem vozila, korisnik je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.{'\n\n'}
            4. Zabranjeno je korišćenje vozila pod uticajem alkohola ili narkotičkih sredstava.{'\n\n'}
            5. Vozilo se ne smije koristiti za prevoz opasnih materija ili u komercijalne svrhe bez pisane saglasnosti iznajmljivača.{'\n\n'}
            6. Sve štete nastale tokom perioda najma su na teret korisnika.
          </Text>
        </View>

        {/* Potpisi */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>IZNAJMLJIVAČ</Text>
            <Text style={{ fontSize: 9, marginTop: 5 }}>NOVERA RENT d.o.o.</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>KORISNIK</Text>
            <Text style={{ fontSize: 9, marginTop: 5 }}>{data.client_name}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Datum: {format(new Date(), 'dd.MM.yyyy')} | Mjesto: Prijedor, Republika Srpska
        </Text>
      </Page>
    </Document>
  );
};

export async function generateContract(data: ContractData): Promise<Buffer> {
  const doc = <ContractDocument data={data} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer);
}