// lib/pdf-generator.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

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
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 180,
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
    lineHeight: 1.4,
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
  subsection: {
    marginLeft: 10,
    marginBottom: 15,
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
  driving_license_number?: string;
  id_card_issue_date?: string;
  id_card_valid_until?: string;
  id_card_issued_by?: string;
  driving_license_issue_date?: string;
  driving_license_valid_until?: string;
  driving_license_issued_by?: string;
}

const ContractDocument: React.FC<{ data: ContractData }> = ({ data }) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

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
          
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>IZNAJMLJIVAČ:</Text>
          <View style={styles.subsection}>
            <View style={styles.row}>
              <Text style={styles.label}>Naziv:</Text>
              <Text style={styles.value}>Novera Rent d.o.o.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Adresa:</Text>
              <Text style={styles.value}>Prijedor, Republika Srpska</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Telefon:</Text>
              <Text style={styles.value}>+387 XX XXX XXX</Text>
            </View>
          </View>

          <Text style={{ fontWeight: 'bold', marginBottom: 10, marginTop: 15 }}>IZNAJMOPRIMAC (KLIJENT):</Text>
          <View style={styles.subsection}>
            <View style={styles.row}>
              <Text style={styles.label}>Ime i prezime:</Text>
              <Text style={styles.value}>{data.client_name}</Text>
            </View>
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
            {data.client_address && (
              <View style={styles.row}>
                <Text style={styles.label}>Adresa:</Text>
                <Text style={styles.value}>{data.client_address}</Text>
              </View>
            )}
          </View>

          {/* Podaci o ličnoj karti */}
          <Text style={{ fontWeight: 'bold', marginBottom: 10, marginTop: 15 }}>PODACI O LIČNOJ KARTI:</Text>
          <View style={styles.subsection}>
            {data.client_id_number && (
              <View style={styles.row}>
                <Text style={styles.label}>Broj lične karte:</Text>
                <Text style={styles.value}>{data.client_id_number}</Text>
              </View>
            )}
            {data.id_card_issue_date && (
              <View style={styles.row}>
                <Text style={styles.label}>Datum izdavanja:</Text>
                <Text style={styles.value}>{formatDate(data.id_card_issue_date)}</Text>
              </View>
            )}
            {data.id_card_valid_until && (
              <View style={styles.row}>
                <Text style={styles.label}>Vrijedi do:</Text>
                <Text style={styles.value}>{formatDate(data.id_card_valid_until)}</Text>
              </View>
            )}
            {data.id_card_issued_by && (
              <View style={styles.row}>
                <Text style={styles.label}>Izdata od:</Text>
                <Text style={styles.value}>{data.id_card_issued_by}</Text>
              </View>
            )}
          </View>

          {/* Podaci o vozačkoj dozvoli */}
          <Text style={{ fontWeight: 'bold', marginBottom: 10, marginTop: 15 }}>PODACI O VOZAČKOJ DOZVOLI:</Text>
          <View style={styles.subsection}>
            {data.driving_license_number && (
              <View style={styles.row}>
                <Text style={styles.label}>Broj vozačke dozvole:</Text>
                <Text style={styles.value}>{data.driving_license_number}</Text>
              </View>
            )}
            {data.driving_license_issue_date && (
              <View style={styles.row}>
                <Text style={styles.label}>Datum izdavanja:</Text>
                <Text style={styles.value}>{formatDate(data.driving_license_issue_date)}</Text>
              </View>
            )}
            {data.driving_license_valid_until && (
              <View style={styles.row}>
                <Text style={styles.label}>Vrijedi do:</Text>
                <Text style={styles.value}>{formatDate(data.driving_license_valid_until)}</Text>
              </View>
            )}
            {data.driving_license_issued_by && (
              <View style={styles.row}>
                <Text style={styles.label}>Izdata od:</Text>
                <Text style={styles.value}>{data.driving_license_issued_by}</Text>
              </View>
            )}
          </View>
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
            <Text style={styles.label}>Datum početka:</Text>
            <Text style={styles.value}>{format(startDate, 'dd.MM.yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Datum završetka:</Text>
            <Text style={styles.value}>{format(endDate, 'dd.MM.yyyy')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Broj dana:</Text>
            <Text style={styles.value}>{days}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. FINANSIJSKI USLOVI</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cijena po danu:</Text>
            <Text style={styles.value}>{data.daily_rate.toFixed(2)} KM</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Broj dana:</Text>
            <Text style={styles.value}>{days}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ukupna cijena:</Text>
            <Text style={styles.value}>{data.total_price.toFixed(2)} KM</Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.sectionTitle}>5. USLOVI KORIŠTENJA I ODGOVORNOSTI</Text>
          <Text>
            5.1. Iznajmoprimac se obavezuje da će vozilo koristiti u skladu sa pravilima saobraćaja Republike Srpske i BiH.{'\n\n'}
            5.2. Vozilo se vraća u istom stanju u kojem je preuzeto, sa istom količinom goriva.{'\n\n'}
            5.3. Iznajmoprimac snosi punu materijalnu odgovornost za sve štete nastale na vozilu tokom perioda iznajmljivanja.{'\n\n'}
            5.4. U slučaju kašnjenja sa vraćanjem vozila, iznajmoprimac je dužan platiti penale u iznosu od 50% dnevne cijene za svaki dan kašnjenja.{'\n\n'}
            5.5. Vozilo se ne smije koristiti van teritorije BiH bez prethodne pismene dozvole iznajmljivača.{'\n\n'}
            5.6. Zabranjena je upotreba vozila pod uticajem alkohola ili narkotičkih supstanci.{'\n\n'}
            5.7. Ovaj ugovor stupa na snagu danom potpisivanja i važy do isteka perioda iznajmljivanja.
          </Text>
        </View>

        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Iznajmljivač</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>Novera Rent d.o.o.</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Iznajmoprimac</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>{data.client_name}</Text>
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