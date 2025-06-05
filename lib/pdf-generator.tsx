// lib/pdf-generator.ts
import jsPDF from 'jspdf';
import { format } from 'date-fns';

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

interface ContractTemplate {
  company_name: string;
  company_address: string;
  company_phone?: string;
  company_email?: string;
  contract_terms: string;
  penalty_rate: number;
  logo_url?: string;
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

interface ClientDetails {
  birth_date?: string;
  birth_place?: string;
  id_issued_by?: string;
  id_issue_date?: string;
  id_expiry_date?: string;
  driver_license_number?: string;
  driver_license_issued_by?: string;
  driver_license_issue_date?: string;
  driver_license_expiry_date?: string;
}

interface RentalDetails {
  start_kilometers?: number;
  end_kilometers?: number;
  pickup_time?: string;
  return_time?: string;
}

// Klasa za upravljanje PDF dokumentom
class PDFManager {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private pageWidth: number;
  private leftMargin: number;
  private rightMargin: number;
  private bottomMargin: number;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.leftMargin = 15;
    this.rightMargin = 15;
    this.bottomMargin = 20;
  }

  checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.currentY = 20;
    }
  }

  addText(
    text: string, 
    x: number, 
    y?: number, 
    options?: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
      autoY?: boolean;
    }
  ): number {
    const fontSize = options?.fontSize || 10;
    const fontStyle = options?.fontStyle || 'normal';
    const align = options?.align || 'left';
    const maxWidth = options?.maxWidth || (this.pageWidth - this.leftMargin - this.rightMargin);
    const useAutoY = options?.autoY !== false;
    
    const actualY = y || this.currentY;

    this.doc.setFontSize(fontSize);
    this.doc.setFont(undefined, fontStyle);

    // Convert Serbian characters
    const serbianText = text
      .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/đ/g, 'd')
      .replace(/š/g, 's').replace(/ž/g, 'z')
      .replace(/Č/g, 'C').replace(/Ć/g, 'C').replace(/Đ/g, 'D')
      .replace(/Š/g, 'S').replace(/Ž/g, 'Z');

    if (text.length > 50 || maxWidth < this.pageWidth - 30) {
      const lines = this.doc.splitTextToSize(serbianText, maxWidth);
      const totalHeight = lines.length * (fontSize * 0.35);
      
      if (useAutoY) {
        this.checkPageBreak(totalHeight + 5);
      }
      
      this.doc.text(lines, x, y || this.currentY, { align });
      
      if (useAutoY) {
        this.currentY += totalHeight + 3;
      }
      
      return totalHeight;
    } else {
      if (useAutoY) {
        this.checkPageBreak(fontSize * 0.35 + 3);
      }
      
      this.doc.text(serbianText, x, y || this.currentY, { align });
      
      if (useAutoY) {
        this.currentY += fontSize * 0.35 + 3;
      }
      
      return fontSize * 0.35;
    }
  }

  addSpace(space: number): void {
    this.currentY += space;
  }

  drawLine(x1: number, y1: number, x2: number, y2: number): void {
    this.doc.line(x1, y1, x2, y2);
  }

  drawRect(x: number, y: number, width: number, height: number, style?: 'S' | 'F' | 'FD'): void {
    this.doc.rect(x, y, width, height, style);
  }

  setTextColor(r: number, g?: number, b?: number): void {
    if (g !== undefined && b !== undefined) {
      this.doc.setTextColor(r, g, b);
    } else {
      this.doc.setTextColor(r);
    }
  }

  addImage(dataUrl: string, x: number, y: number, width: number, height: number): void {
    this.doc.addImage(dataUrl, 'JPEG', x, y, width, height);
  }

  getPageWidth(): number {
    return this.pageWidth;
  }

  getLeftMargin(): number {
    return this.leftMargin;
  }

  getRightMargin(): number {
    return this.rightMargin;
  }

  getCurrentY(): number {
    return this.currentY;
  }

  setCurrentY(y: number): void {
    this.currentY = y;
  }

  output(type: string): ArrayBuffer {
    return this.doc.output(type as any);
  }
}

// Function to create table
function createTable(
  pdf: PDFManager,
  data: string[][],
  options?: {
    startY?: number;
    columnWidths?: number[];
    rowHeight?: number;
    fontSize?: number;
    headerStyle?: boolean;
  }
): number {
  const startY = options?.startY || pdf.getCurrentY();
  const rowHeight = options?.rowHeight || 8;
  const fontSize = options?.fontSize || 9;
  const headerStyle = options?.headerStyle || false;

  const pageWidth = pdf.getPageWidth();
  const leftMargin = pdf.getLeftMargin();
  const rightMargin = pdf.getRightMargin();
  const tableWidth = pageWidth - leftMargin - rightMargin;

  // Calculate column widths
  const columnWidths = options?.columnWidths || 
    Array(data[0]?.length || 1).fill(tableWidth / (data[0]?.length || 1));

  let currentY = startY;

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    pdf.checkPageBreak(rowHeight + 5);
    currentY = pdf.getCurrentY();

    let currentX = leftMargin;

    row.forEach((cell, colIndex) => {
      const cellWidth = columnWidths[colIndex] || tableWidth / row.length;
      
      // Draw cell border
      pdf.drawRect(currentX, currentY, cellWidth, rowHeight);
      
      // Add cell text
      pdf.addText(cell, currentX + 2, currentY + (rowHeight / 2) + 2, {
        fontSize: fontSize,
        fontStyle: (rowIndex === 0 && headerStyle) ? 'bold' : 'normal',
        maxWidth: cellWidth - 4,
        autoY: false
      });

      currentX += cellWidth;
    });

    pdf.setCurrentY(currentY + rowHeight);
  });

  return pdf.getCurrentY();
}

// Generate Jandra Cars style contract
function generateJandraStyleContract(
  pdf: PDFManager,
  data: ContractData,
  template: ContractTemplate,
  clientDetails?: ClientDetails,
  rentalDetails?: RentalDetails
) {
  const pageWidth = pdf.getPageWidth();
  const leftMargin = pdf.getLeftMargin();

  // Header with company info
  pdf.addText(template.company_name, leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });

  pdf.addText(template.company_address, leftMargin, undefined, {
    fontSize: 10
  });

  if (template.owner_name) {
    pdf.addText(`Vl ${template.owner_name}`, leftMargin, undefined, {
      fontSize: 10
    });
  }

  // Contact info (right side)
  let contactY = 20;
  if (template.company_email) {
    pdf.addText(`Email: ${template.company_email}`, pageWidth * 0.6, contactY, {
      fontSize: 9,
      autoY: false
    });
    contactY += 6;
  }

  if (template.company_phone) {
    pdf.addText(`Tel: ${template.company_phone}`, pageWidth * 0.6, contactY, {
      fontSize: 9,
      autoY: false
    });
  }

  pdf.addSpace(10);

  // JIB and Bank account
  if (template.jib_number) {
    pdf.addText(`JIB: ${template.jib_number}`, leftMargin, undefined, {
      fontSize: 9
    });
  }

  if (template.bank_account) {
    pdf.addText(`Ziro racun: ${template.bank_account}`, leftMargin, undefined, {
      fontSize: 9
    });
  }

  pdf.addSpace(15);

  // Contract title
  pdf.addText('U G O V O R', pageWidth / 2, undefined, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'center'
  });

  pdf.addText(`O NAJMU BR.: ${String(data.id).padStart(2, '0')} / ${new Date().getFullYear().toString().slice(-2)}`, pageWidth / 2, undefined, {
    fontSize: 12,
    fontStyle: 'bold',
    align: 'center'
  });

  pdf.addText('(RENTAL AGREEMENT NO.)', pageWidth / 2, undefined, {
    fontSize: 8,
    align: 'center'
  });

  pdf.addSpace(10);

  // Create client and vehicle info table
  const tableData: string[][] = [
    ['Ime korisnika / Renters name:', data.client_name],
    ['Adresa korisnika / Renters address:', data.client_address || ''],
    ['Telefon / mob:', data.client_phone || ''],
  ];

  // Add detailed client info if enabled
  if (template.include_id_details && clientDetails) {
    tableData.push(
      ['Datum i mjesto rodjenja / Birth date and place:', `${clientDetails.birth_date || ''}, ${clientDetails.birth_place || ''}`],
      ['Licna karta br / ID no:', data.client_id_number || ''],
      ['Izdat od / Issued by:', clientDetails.id_issued_by || ''],
      ['Datum izdavanja / Issue date:', clientDetails.id_issue_date || ''],
      ['Vrijedi do / Expires:', clientDetails.id_expiry_date || '']
    );
  }

  // Add driver license info if enabled
  if (template.include_driver_license && clientDetails) {
    tableData.push(
      ['Vozacka dozvola br / Driver licence no:', clientDetails.driver_license_number || ''],
      ['Izdat od / Issued by:', clientDetails.driver_license_issued_by || ''],
      ['Datum izdavanja / Issue date:', clientDetails.driver_license_issue_date || ''],
      ['Vrijedi do / Expires:', clientDetails.driver_license_expiry_date || '']
    );
  }

  // Vehicle information
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  tableData.push(
    ['Vrsta vozila / Vehicle type:', 'Putnicko motorno vozilo / Personal car'],
    ['Marka i model / Make and model:', `${data.brand} ${data.model}`],
    ['Registarske table / Reg. number:', data.registration_number],
    ['Vrijeme koristenja / Rental time:', `${days} dana / days`],
    ['Pocetak / Start date:', `${format(startDate, 'dd.MM.yyyy')} / ${rentalDetails?.pickup_time || '13:00h'}`],
    ['Zavrsetak / End date:', `${format(endDate, 'dd.MM.yyyy')} / ${rentalDetails?.return_time || '13:00h'}`]
  );

  // Add kilometers if enabled
  if (template.include_km_fields) {
    tableData.push(['Pocetna kilometraza / Start km:', `${rentalDetails?.start_kilometers || '______'} km`]);
  }

  tableData.push(['Cijena po danu / Price per day:', `${data.daily_rate.toFixed(2)} KM`]);

  // Create table
  createTable(pdf, tableData, {
    columnWidths: [(pageWidth - 30) * 0.6, (pageWidth - 30) * 0.4],
    rowHeight: 10,
    fontSize: 9
  });

  pdf.addSpace(10);

  // Fuel policy
  if (template.fuel_policy) {
    pdf.addText(template.fuel_policy, leftMargin, undefined, {
      fontSize: 9,
      maxWidth: pageWidth - 30
    });
    pdf.addSpace(10);
  }

  // Contract terms
  if (template.contract_terms) {
    pdf.addText('USLOVI UGOVORA:', leftMargin, undefined, {
      fontSize: 11,
      fontStyle: 'bold'
    });

    const processedTerms = template.contract_terms.replace(
      /\{penalty_rate\}/g, 
      template.penalty_rate.toString()
    );

    // Split terms into paragraphs
    const paragraphs = processedTerms.split('\n').filter(p => p.trim().length > 0);
    
    paragraphs.forEach(paragraph => {
      pdf.addText(paragraph.trim(), leftMargin, undefined, {
        fontSize: 9,
        maxWidth: pageWidth - 30
      });
      pdf.addSpace(3);
    });
  }

  pdf.addSpace(15);

  // Total price highlight
  pdf.setTextColor(0, 100, 200);
  pdf.addText(`UKUPNA CIJENA: ${data.total_price.toFixed(2)} KM`, pageWidth / 2, undefined, {
    fontSize: 14,
    fontStyle: 'bold',
    align: 'center'
  });
  pdf.setTextColor(0, 0, 0);

  pdf.addSpace(20);

  // Signature section
  const signatureY = pdf.getCurrentY();
  
  // Make sure we have enough space for signatures
  pdf.checkPageBreak(40);
  
  const finalSignatureY = pdf.getCurrentY();
  
  // Draw signature lines
  pdf.drawLine(leftMargin + 20, finalSignatureY + 30, leftMargin + 100, finalSignatureY + 30);
  pdf.drawLine(pageWidth - 120, finalSignatureY + 30, pageWidth - 40, finalSignatureY + 30);

  // Add signature labels
  pdf.addText('Iznajmljivac', leftMargin + 45, finalSignatureY + 40, {
    fontSize: 10,
    align: 'center',
    autoY: false
  });

  pdf.addText(template.company_name, leftMargin + 45, finalSignatureY + 48, {
    fontSize: 8,
    align: 'center',
    autoY: false
  });

  pdf.addText('Klijent', pageWidth - 80, finalSignatureY + 40, {
    fontSize: 10,
    align: 'center',
    autoY: false
  });

  pdf.addText(data.client_name, pageWidth - 80, finalSignatureY + 48, {
    fontSize: 8,
    align: 'center',
    autoY: false
  });

  // Add location and date
  pdf.addText(`Banja Luka, ${format(new Date(), 'dd.MM.yyyy')} godine`, pageWidth / 2, finalSignatureY + 60, {
    fontSize: 9,
    align: 'center',
    autoY: false
  });
}

// Generate simple contract
function generateSimpleContract(
  pdf: PDFManager,
  data: ContractData,
  template: ContractTemplate
) {
  const pageWidth = pdf.getPageWidth();
  const leftMargin = pdf.getLeftMargin();

  // Header
  pdf.addText('UGOVOR O IZNAJMLJIVANJU VOZILA', pageWidth / 2, undefined, {
    fontSize: 18,
    fontStyle: 'bold',
    align: 'center'
  });

  pdf.addText(`Broj ugovora: ${data.id}/${new Date().getFullYear()}`, pageWidth / 2, undefined, {
    fontSize: 12,
    align: 'center'
  });

  pdf.addSpace(15);

  // Company info
  pdf.addText('1. IZNAJMLJIVAC', leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  
  pdf.addText(template.company_name, leftMargin, undefined, { fontSize: 11 });
  pdf.addText(template.company_address, leftMargin, undefined, { fontSize: 10 });

  pdf.addSpace(10);

  // Client info
  pdf.addText('2. KLIJENT', leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  
  pdf.addText(data.client_name, leftMargin, undefined, { fontSize: 11 });
  if (data.client_address) {
    pdf.addText(data.client_address, leftMargin, undefined, { fontSize: 10 });
  }
  pdf.addText(data.client_email, leftMargin, undefined, { fontSize: 10 });

  pdf.addSpace(10);

  // Vehicle info
  pdf.addText('3. VOZILO', leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  
  pdf.addText(`${data.brand} ${data.model} (${data.year})`, leftMargin, undefined, { fontSize: 11 });
  pdf.addText(`Registarski broj: ${data.registration_number}`, leftMargin, undefined, { fontSize: 10 });

  pdf.addSpace(10);

  // Rental period and price
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  pdf.addText('4. PERIOD I CIJENA', leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  
  pdf.addText(`Od: ${format(startDate, 'dd.MM.yyyy')} do: ${format(endDate, 'dd.MM.yyyy')}`, leftMargin, undefined, { fontSize: 10 });
  pdf.addText(`Broj dana: ${days}`, leftMargin, undefined, { fontSize: 10 });
  pdf.addText(`Cijena po danu: ${data.daily_rate.toFixed(2)} KM`, leftMargin, undefined, { fontSize: 10 });
  
  // Highlight total price
  pdf.setTextColor(0, 100, 200);
  pdf.addText(`UKUPNA CIJENA: ${data.total_price.toFixed(2)} KM`, leftMargin, undefined, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  pdf.setTextColor(0, 0, 0);

  pdf.addSpace(15);

  // Terms
  if (template.contract_terms) {
    pdf.addText('5. USLOVI', leftMargin, undefined, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    
    const processedTerms = template.contract_terms.replace(
      /\{penalty_rate\}/g, 
      template.penalty_rate.toString()
    );
    
    pdf.addText(processedTerms, leftMargin, undefined, {
      fontSize: 10,
      maxWidth: pageWidth - 30
    });
  }

  pdf.addSpace(30);

  // Signatures
  const signatureY = pdf.getCurrentY();
  pdf.checkPageBreak(50);
  const finalSignatureY = pdf.getCurrentY();

  pdf.drawLine(leftMargin + 20, finalSignatureY + 20, leftMargin + 100, finalSignatureY + 20);
  pdf.drawLine(pageWidth - 120, finalSignatureY + 20, pageWidth - 40, finalSignatureY + 20);
  
  pdf.addText('Iznajmljivac', leftMargin + 50, finalSignatureY + 30, {
    fontSize: 10,
    align: 'center',
    autoY: false
  });
  
  pdf.addText('Klijent', pageWidth - 80, finalSignatureY + 30, {
    fontSize: 10,
    align: 'center',
    autoY: false
  });
}

export async function generateContract(
  data: ContractData, 
  template: ContractTemplate,
  clientDetails?: ClientDetails,
  rentalDetails?: RentalDetails
): Promise<Buffer> {
  const pdf = new PDFManager();
  
  try {
    // Add logo if available
    if (template.logo_url) {
      try {
        const response = await fetch(template.logo_url);
        const blob = await response.blob();
        const reader = new FileReader();
        
        await new Promise<void>((resolve) => {
          reader.onload = function() {
            try {
              const dataUrl = reader.result as string;
              pdf.addImage(dataUrl, pdf.getPageWidth() - 60, 10, 40, 40);
            } catch (error) {
              console.error('Error adding image:', error);
            }
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    
    // Generate contract based on style
    if (template.contract_style === 'jandra_style') {
      generateJandraStyleContract(pdf, data, template, clientDetails, rentalDetails);
    } else {
      generateSimpleContract(pdf, data, template);
    }
    
    // Convert to buffer
    const pdfOutput = pdf.output('arraybuffer');
    return Buffer.from(pdfOutput);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF contract');
  }
}