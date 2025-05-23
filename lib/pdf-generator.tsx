// lib/pdf-generator.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts if needed
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/Roboto-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
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
  },
  disclaimer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: 'justify',
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
        <View style={styles.header}>
          <Text style={styles.title}>UGOVOR O IZNAJMLJIVANJU VOZILA</Text>
          <Text>Broj ugovora: {data.id}/{new Date().getFullYear()}</Text>
          <Text>Datum: {format(new Date(), 'dd.MM.yyyy')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. UGOVORNE STRANE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Iznajmljivač:</Text>
            <Text style={styles.value}>Rent-a-Car Company d.o.o.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Adresa:</Text>
            <Text style={styles.value}>Prijedor, Republika Srpska</Text>
          </View>
          <Text style={{ marginTop: 10 }}>i</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Klijent:</Text>
            <Text style={styles.value}>{data.client_name}</Text>
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
              <Text style={styles.value}>{data.client_address}</Text>
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
            <Text style={styles.value}>{data.brand} {data.model} ({data.year})</Text>
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
          <Text style={styles.sectionTitle}>5. USLOVI KORIŠTENJA</Text>
          <Text>
            Klijent se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja i da će ga vratiti u istom stanju u kojem ga je preuzeo. 
            Klijent snosi punu odgovornost za sve štete nastale tokom perioda iznajmljivanja. 
            U slučaju kašnjenja sa vraćanjem vozila, klijent je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Iznajmljivač</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Klijent</Text>
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