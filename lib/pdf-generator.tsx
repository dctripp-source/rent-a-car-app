// lib/pdf-generator.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Registruj Open Sans font koji podržava srpska slova
Font.register({
  family: 'OpenSans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4taVQUwaEQXjN_mQ.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4kaVQUwaEQXjN_mQ.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Alternativno, možete koristiti Roboto
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'OpenSans', // Promena sa 'Helvetica' na 'OpenSans'
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'OpenSans',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'OpenSans',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
    fontFamily: 'OpenSans',
  },
  value: {
    flex: 1,
    fontFamily: 'OpenSans',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  tableCol: {
    flex: 1,
    fontFamily: 'OpenSans',
  },
  disclaimer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: 'justify',
    fontFamily: 'OpenSans',
  },
  signature: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 200,
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 50,
    marginBottom: 5,
  },
  textNormal: {
    fontFamily: 'OpenSans',
    fontWeight: 'normal',
  },
  textBold: {
    fontFamily: 'OpenSans',
    fontWeight: 'bold',
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

// Funkcija za normalizaciju teksta (konvertuje specifične karaktere)
const normalizeText = (text: string): string => {
  return text
    .replace(/č/g, 'č')
    .replace(/ć/g, 'ć')
    .replace(/š/g, 'š')
    .replace(/đ/g, 'đ')
    .replace(/ž/g, 'ž')
    .replace(/Č/g, 'Č')
    .replace(/Ć/g, 'Ć')
    .replace(/Š/g, 'Š')
    .replace(/Đ/g, 'Đ')
    .replace(/Ž/g, 'Ž');
};

const ContractDocument: React.FC<{ data: ContractData }> = ({ data }) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>UGOVOR O IZNAJMLJIVANJU VOZILA</Text>
          <Text style={styles.textNormal}>Broj ugovora: {data.id}/{new Date().getFullYear()}</Text>
          <Text style={styles.textNormal}>Datum: {format(new Date(), 'dd.MM.yyyy')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. UGOVORNE STRANE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Iznajmljivač:</Text>
            <Text style={styles.value}>Novera Rent d.o.o.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresa:</Text>
            <Text style={styles.value}>Prijedor, Republika Srpska</Text>
          </View>
          <Text style={[styles.textNormal, { marginTop: 10 }]}>i</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Klijent:</Text>
            <Text style={styles.value}>{normalizeText(data.client_name)}</Text>
          </View>
          {data.client_id_number && (
            <View style={styles.row}>
              <Text style={styles.label}>Broj lične karte:</Text>
              <Text style={styles.value}>{data.client_id_number}</Text>
            </View>
          )}
          {data.client_address && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresa:</Text>
              <Text style={styles.value}>{normalizeText(data.client_address)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.client_email}</Text>
          </View>
          {data.client_phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={styles.value}>{data.client_phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. PREDMET UGOVORA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Vozilo:</Text>
            <Text style={styles.value}>{normalizeText(data.brand)} {normalizeText(data.model)} ({data.year})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registarski broj:</Text>
            <Text style={styles.value}>{data.registration_number}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. PERIOD IZNAJMLJIVANJA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Od:</Text>
            <Text style={styles.value}>{format(startDate, 'dd.MM.yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Do:</Text>
            <Text style={styles.value}>{format(endDate, 'dd.MM.yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Broj dana:</Text>
            <Text style={styles.value}>{days}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. CIJENA</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cijena po danu:</Text>
            <Text style={styles.value}>{data.daily_rate.toFixed(2)} KM</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ukupna cijena:</Text>
            <Text style={styles.value}>{data.total_price.toFixed(2)} KM</Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.sectionTitle}>5. USLOVI KORIŠĆENJA</Text>
          <Text style={styles.textNormal}>
            {normalizeText(`Klijent se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja i da će ga vratiti u istom stanju u kojem ga je preuzeo. 
            Klijent snosi punu odgovornost za sve štete nastale tokom perioda iznajmljivanja. 
            U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.`)}
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.textNormal}>Iznajmljivač</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.textNormal}>Klijent</Text>
          </View>
        </View>
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