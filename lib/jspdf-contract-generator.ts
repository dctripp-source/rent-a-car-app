// lib/jspdf-contract-generator.ts
import jsPDF from 'jspdf';

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

export function generateContractWithJsPDF(data: ContractData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Podešavanje font-a
  doc.setFont('helvetica');
  
  let yPosition = 25;
  const leftMargin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const rightMargin = pageWidth - 20;
  
  // Header - Naslov
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('UGOVOR O IZNAJMLJIVANJU VOZILA', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Broj ugovora: ${data.id}/${new Date().getFullYear()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  doc.text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;
  
  // 1. UGOVORNE STRANE
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. UGOVORNE STRANE', leftMargin, yPosition);
  
  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Iznajmljivac:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text('Novera Rent d.o.o.', leftMargin + 35, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Adresa:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text('Prijedor, Republika Srpska', leftMargin + 35, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('PIB:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text('123456789', leftMargin + 35, yPosition);
  
  yPosition += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('i', leftMargin, yPosition);
  
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Iznajmljivac (klijent):', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_name, leftMargin + 55, yPosition);
  
  if (data.client_id_number) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Broj licne karte:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(data.client_id_number, leftMargin + 45, yPosition);
  }
  
  if (data.client_address) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Adresa:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    // Razdeli adresu na više linija ako je dugačka
    const addressLines = doc.splitTextToSize(data.client_address, pageWidth - leftMargin - 45);
    doc.text(addressLines, leftMargin + 35, yPosition);
    yPosition += (addressLines.length - 1) * 6;
  }
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client_email, leftMargin + 35, yPosition);
  
  if (data.client_phone) {
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Telefon:', leftMargin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(data.client_phone, leftMargin + 35, yPosition);
  }
  
  yPosition += 20;
  
  // 2. PREDMET UGOVORA
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. PREDMET UGOVORA', leftMargin, yPosition);
  
  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Vozilo:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.brand} ${data.model} (${data.year})`, leftMargin + 35, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Registarski broj:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(data.registration_number, leftMargin + 45, yPosition);
  
  yPosition += 20;
  
  // 3. PERIOD IZNAJMLJIVANJA
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('3. PERIOD IZNAJMLJIVANJA', leftMargin, yPosition);
  
  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Datum pocetka:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(startDate.toLocaleDateString('sr-RS'), leftMargin + 40, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Datum zavrsetka:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(endDate.toLocaleDateString('sr-RS'), leftMargin + 45, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Broj dana:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(days.toString(), leftMargin + 35, yPosition);
  
  yPosition += 20;
  
  // 4. CIJENA
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('4. CIJENA', leftMargin, yPosition);
  
  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Cijena po danu:', leftMargin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.daily_rate.toFixed(2)} KM`, leftMargin + 40, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('UKUPNA CIJENA:', leftMargin, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${data.total_price.toFixed(2)} KM`, leftMargin + 50, yPosition);
  
  yPosition += 20;
  
  // 5. USLOVI KORISTENJA
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('5. USLOVI KORISTENJA', leftMargin, yPosition);
  
  yPosition += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const disclaimerText = `Klijent se obavezuje da ce vozilo koristiti u skladu sa pravilima saobracaja i da ce ga vratiti u istom stanju u kojem ga je preuzeo. Klijent snosi punu odgovornost za sve stete nastale tokom perioda iznajmljivanja. U slucaju kasnjenja sa vracanjem vozila, klijent je duzan platiti penale u iznosu od 50% dnevne cijene za svaki dan kasnjenja.

Klijent je duzan da vrati vozilo sa istom kolicinom goriva kao sto je preuzeo. U suprotnom, razlika u gorivo ce biti naplacena po trzisnoj cijeni.

Zabranjeno je pusenje u vozilu, prevoz kucnih ljubimaca bez prethodne dozvole, kao i koriscenje vozila za taksi ili rent-a-car djelatnost.

Ovaj ugovor stupa na snagu danom potpisa obe ugovorne strane.`;
  
  const splitText = doc.splitTextToSize(disclaimerText, pageWidth - 40);
  doc.text(splitText, leftMargin, yPosition);
  
  yPosition += splitText.length * 4 + 25;
  
  // Provjeri da li treba nova stranica
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 30;
  }
  
  // 6. POTPISI
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('6. POTPISI', leftMargin, yPosition);
  
  yPosition += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Linija za potpis iznajmljivaca
  const signatureLineLength = 60;
  doc.line(leftMargin, yPosition, leftMargin + signatureLineLength, yPosition);
  doc.text('Iznajmljivac', leftMargin + 15, yPosition + 8);
  doc.text('Novera Rent d.o.o.', leftMargin + 10, yPosition + 15);
  
  // Linija za potpis klijenta
  const rightSignatureX = pageWidth - signatureLineLength - 20;
  doc.line(rightSignatureX, yPosition, rightSignatureX + signatureLineLength, yPosition);
  doc.text('Klijent', rightSignatureX + 25, yPosition + 8);
  doc.text(data.client_name, rightSignatureX + 5, yPosition + 15);
  
  // Datum
  yPosition += 25;
  doc.text(`Datum: ${new Date().toLocaleDateString('sr-RS')}`, leftMargin, yPosition);
  doc.text(`Mjesto: Prijedor`, rightSignatureX + 10, yPosition);
  
  // Konvertuj u Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}

// Export kao glavna funkcija
export function generateContract(data: ContractData): Buffer {
  return generateContractWithJsPDF(data);
}