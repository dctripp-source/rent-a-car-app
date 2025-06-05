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

// Function to add Serbian text with proper encoding
function addSerbianText(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  }
) {
  const fontSize = options?.fontSize || 10;
  const fontStyle = options?.fontStyle || 'normal';
  const align = options?.align || 'left';
  const maxWidth = options?.maxWidth || 180;

  doc.setFontSize(fontSize);
  
  if (fontStyle === 'bold') {
    doc.setFont(undefined, 'bold');
  } else if (fontStyle === 'italic') {
    doc.setFont(undefined, 'italic');
  } else {
    doc.setFont(undefined, 'normal');
  }

  // Convert Serbian characters
  const serbianText = text
    .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/đ/g, 'd')
    .replace(/š/g, 's').replace(/ž/g, 'z')
    .replace(/Č/g, 'C').replace(/Ć/g, 'C').replace(/Đ/g, 'D')
    .replace(/Š/g, 'S').replace(/Ž/g, 'Z');

  if (maxWidth && text.length > 50) {
    const lines = doc.splitTextToSize(serbianText, maxWidth);
    doc.text(lines, x, y, { align });
    return y + (lines.length * (fontSize * 0.35));
  } else {
    doc.text(serbianText, x, y, { align });
    return y + (fontSize * 0.35);
  }
}

// Function to draw table cell
function drawTableCell(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  options?: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    fillColor?: string;
    textColor?: string;
    border?: boolean;
  }
) {
  const fontSize = options?.fontSize || 9;
  const fontStyle = options?.fontStyle || 'normal';
  const border = options?.border !== false;
  
  // Draw cell border
  if (border) {
    doc.rect(x, y, width, height);
  }
  
  // Fill background if specified
  if (options?.fillColor) {
    doc.setFillColor(options.fillColor);
    doc.rect(x, y, width, height, 'F');
  }
  
  // Set text color
  if (options?.textColor) {
    doc.setTextColor(options.textColor);
  } else {
    doc.setTextColor(0, 0, 0);
  }
  
  // Add text
  doc.setFontSize(fontSize);
  doc.setFont(undefined, fontStyle);
  
  const lines = doc.splitTextToSize(text, width - 4);
  const textHeight = lines.length * (fontSize * 0.35);
  const textY = y + (height - textHeight) / 2 + (fontSize * 0.35);
  
  doc.text(lines, x + 2, textY);
}

// Generate Jandra Cars style contract
function generateJandraStyleContract(
  doc: jsPDF,
  data: ContractData,
  template: ContractTemplate,
  clientDetails?: ClientDetails,
  rentalDetails?: RentalDetails
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 15;
  const rightMargin = 15;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  let currentY = 20;
  const rowHeight = 8;
  
  // Header section with company info
  const headerHeight = 25;
  
  // Company name and address (left side)
  drawTableCell(doc, template.company_name, leftMargin, currentY, contentWidth * 0.4, headerHeight * 0.4, {
    fontSize: 11,
    fontStyle: 'bold'
  });
  
  currentY += headerHeight * 0.4;
  drawTableCell(doc, template.company_address, leftMargin, currentY, contentWidth * 0.4, headerHeight * 0.3, {
    fontSize: 9
  });
  
  currentY += headerHeight * 0.3;
  if (template.owner_name) {
    drawTableCell(doc, `Vl ${template.owner_name}`, leftMargin, currentY, contentWidth * 0.4, headerHeight * 0.3, {
      fontSize: 9
    });
  }
  
  // Contact info (right side)
  currentY = 20;
  if (template.company_email) {
    drawTableCell(doc, 'Email:', pageWidth * 0.55, currentY, contentWidth * 0.15, rowHeight, {
      fontSize: 9,
      fontStyle: 'bold'
    });
    drawTableCell(doc, template.company_email, pageWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, {
      fontSize: 9
    });
    currentY += rowHeight;
  }
  
  if (template.company_phone) {
    drawTableCell(doc, 'Tel:', pageWidth * 0.55, currentY, contentWidth * 0.15, rowHeight, {
      fontSize: 9,
      fontStyle: 'bold'
    });
    drawTableCell(doc, template.company_phone, pageWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, {
      fontSize: 9
    });
    currentY += rowHeight;
  }
  
  currentY = Math.max(currentY, 45);
  
  // JIB and Bank account row
  if (template.jib_number || template.bank_account) {
    currentY += 5;
    
    if (template.jib_number) {
      drawTableCell(doc, `JIB: ${template.jib_number}`, leftMargin, currentY, contentWidth * 0.5, rowHeight, {
        fontSize: 9
      });
    }
    
    if (template.bank_account) {
      drawTableCell(doc, 'Ziro racun:', pageWidth * 0.55, currentY, contentWidth * 0.2, rowHeight, {
        fontSize: 9,
        fontStyle: 'bold'
      });
      drawTableCell(doc, template.bank_account, pageWidth * 0.75, currentY, contentWidth * 0.25, rowHeight, {
        fontSize: 9
      });
    }
    
    currentY += rowHeight + 5;
  }
  
  // Contract title
  currentY += 10;
  drawTableCell(doc, 'U G O V O R', pageWidth / 2 - 30, currentY, 60, 10, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  
  currentY += 12;
  drawTableCell(doc, `O NAJMU BR.: ${String(data.id).padStart(2, '0')} / ${new Date().getFullYear().toString().slice(-2)}`, pageWidth / 2 - 40, currentY, 80, 8, {
    fontSize: 11,
    fontStyle: 'bold'
  });
  
  currentY += 10;
  drawTableCell(doc, '(RENTAL AGREEMENT NO.)', pageWidth / 2 - 35, currentY, 70, 6, {
    fontSize: 8
  });
  
  currentY += 15;
  
  // Client information table
  const tableData = [
    ['Ime korisnika / Renters name:', '', data.client_name, ''],
    ['Adresa korisnika (zemlja) / Renters address (country):', '', data.client_address || '', ''],
    ['Telefon / mob:', '', data.client_phone || '', ''],
  ];
  
  // Add detailed client info if enabled
  if (template.include_id_details && clientDetails) {
    tableData.push(
      ['Datum i mjesto rodjenja/ Birth date and place:', '', `${clientDetails.birth_date || ''}, ${clientDetails.birth_place || ''}`, ''],
      ['Licna karta br / Passport no:', data.client_id_number || '', 'Izdat od / issued by:', clientDetails.id_issued_by || ''],
      ['Datum izdavanja / Date of issue:', clientDetails.id_issue_date || '', 'Vrijedi do / Expires:', clientDetails.id_expiry_date || '']
    );
  }
  
  // Add driver license info if enabled
  if (template.include_driver_license && clientDetails) {
    tableData.push(
      ['Vozacka dozvola br / Driver licence no', clientDetails.driver_license_number || '', 'Izdat od / issued by:', clientDetails.driver_license_issued_by || ''],
      ['Datum izdavanja / Date of issue:', clientDetails.driver_license_issue_date || '', 'Vrijedi do / Expires:', clientDetails.driver_license_expiry_date || '']
    );
  }
  
  // Vehicle information
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  tableData.push(
    ['Vrsta vozila / Vehicle type', '', 'Putnicko motorno vozilo / Personal car (PKW)', ''],
    ['Marka i model vozila / Make and model of vehicle', '', `${data.brand} ${data.model}`, ''],
    ['Registarske table vozila / Vehicle number plate:', '', data.registration_number, ''],
    ['Vrijeme koristenja vozila / Rental time (days/months)', '', `${days} dana / days`, ''],
    ['Pocetak koristenja / Start date and time:', '', `${format(startDate, 'dd.MM.yyyy')} / ${rentalDetails?.pickup_time || '13:00h'}`, ''],
    ['Zavrsetak koristenja / The end date and time:', '', `${format(endDate, 'dd.MM.yyyy')} / ${rentalDetails?.return_time || '13:00h'}`, '']
  );
  
  // Add kilometers if enabled
  if (template.include_km_fields) {
    tableData.push(
      ['Pocetna kilometraza na vozilu / Start kilometers on vehicle', '', `${rentalDetails?.start_kilometers || '______'} km`, '']
    );
  }
  
  tableData.push(
    ['Cijena najma po danu / Rental price per day:', '', `${data.daily_rate.toFixed(2)} KM (BAM)`, '']
  );
  
  // Draw table
  const colWidths = [contentWidth * 0.35, contentWidth * 0.15, contentWidth * 0.35, contentWidth * 0.15];
  
  tableData.forEach(row => {
    let x = leftMargin;
    row.forEach((cell, index) => {
      drawTableCell(doc, cell, x, currentY, colWidths[index], rowHeight, {
        fontSize: 8,
        fontStyle: index === 0 ? 'bold' : 'normal'
      });
      x += colWidths[index];
    });
    currentY += rowHeight;
  });
  
  // Fuel policy note
  if (template.fuel_policy) {
    currentY += 5;
    // Use addSerbianText for multi-line text instead of drawTableCell
    addSerbianText(doc, template.fuel_policy, leftMargin, currentY, {
      fontSize: 8,
      maxWidth: contentWidth
    });
    currentY += 25;
  }
  
  // Signature section
  currentY += 10;
  drawTableCell(doc, 'Potpis korisnika / Renters signature:', leftMargin, currentY, contentWidth * 0.5, rowHeight, {
    fontSize: 9
  });
  drawTableCell(doc, `Banja Luka, ${format(new Date(), 'dd.MM.yyyy')} godine`, contentWidth * 0.6, currentY, contentWidth * 0.4, rowHeight, {
    fontSize: 9
  });
  
  currentY += 15;
  
  // Contract terms
  if (template.contract_terms) {
    const processedTerms = template.contract_terms.replace(
      /\{penalty_rate\}/g, 
      template.penalty_rate.toString()
    );
    
    // Use addSerbianText for multi-line text
    addSerbianText(doc, processedTerms, leftMargin, currentY, {
      fontSize: 8,
      maxWidth: contentWidth
    });
    currentY += 35;
  }
  
  // Total price highlight
  currentY += 10;
  doc.setTextColor(0, 100, 200);
  drawTableCell(doc, `UKUPNA CIJENA: ${data.total_price.toFixed(2)} KM`, pageWidth / 2 - 40, currentY, 80, 10, {
    fontSize: 12,
    fontStyle: 'bold'
  });
  doc.setTextColor(0, 0, 0);
}

// Generate simple contract
function generateSimpleContract(
  doc: jsPDF,
  data: ContractData,
  template: ContractTemplate
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 20;
  let currentY = 20;

  // Header
  currentY = addSerbianText(doc, 'UGOVOR O IZNAJMLJIVANJU VOZILA', pageWidth / 2, currentY, {
    fontSize: 18,
    fontStyle: 'bold',
    align: 'center'
  });
  currentY += 10;

  currentY = addSerbianText(doc, `Broj ugovora: ${data.id}/${new Date().getFullYear()}`, pageWidth / 2, currentY, {
    fontSize: 12,
    align: 'center'
  });
  currentY += 15;

  // Company info
  currentY = addSerbianText(doc, '1. IZNAJMLJIVAC', leftMargin, currentY, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  currentY += 8;
  
  currentY = addSerbianText(doc, template.company_name, leftMargin, currentY);
  currentY += 5;
  currentY = addSerbianText(doc, template.company_address, leftMargin, currentY);
  currentY += 15;

  // Client info
  currentY = addSerbianText(doc, '2. KLIJENT', leftMargin, currentY, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  currentY += 8;
  
  currentY = addSerbianText(doc, data.client_name, leftMargin, currentY);
  currentY += 5;
  if (data.client_address) {
    currentY = addSerbianText(doc, data.client_address, leftMargin, currentY);
    currentY += 5;
  }
  currentY = addSerbianText(doc, data.client_email, leftMargin, currentY);
  currentY += 15;

  // Vehicle info
  currentY = addSerbianText(doc, '3. VOZILO', leftMargin, currentY, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  currentY += 8;
  
  currentY = addSerbianText(doc, `${data.brand} ${data.model} (${data.year})`, leftMargin, currentY);
  currentY += 5;
  currentY = addSerbianText(doc, `Registarski broj: ${data.registration_number}`, leftMargin, currentY);
  currentY += 15;

  // Rental period
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  currentY = addSerbianText(doc, '4. PERIOD I CIJENA', leftMargin, currentY, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  currentY += 8;
  
  currentY = addSerbianText(doc, `Od: ${format(startDate, 'dd.MM.yyyy')} do: ${format(endDate, 'dd.MM.yyyy')}`, leftMargin, currentY);
  currentY += 5;
  currentY = addSerbianText(doc, `Broj dana: ${days}`, leftMargin, currentY);
  currentY += 5;
  currentY = addSerbianText(doc, `Cijena po danu: ${data.daily_rate.toFixed(2)} KM`, leftMargin, currentY);
  currentY += 5;
  
  // Highlight total price
  doc.setTextColor(0, 100, 200);
  currentY = addSerbianText(doc, `UKUPNA CIJENA: ${data.total_price.toFixed(2)} KM`, leftMargin, currentY, {
    fontSize: 14,
    fontStyle: 'bold'
  });
  doc.setTextColor(0, 0, 0);
  currentY += 20;

  // Terms
  if (template.contract_terms) {
    currentY = addSerbianText(doc, '5. USLOVI', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 8;
    
    const processedTerms = template.contract_terms.replace(
      /\{penalty_rate\}/g, 
      template.penalty_rate.toString()
    );
    
    currentY = addSerbianText(doc, processedTerms, leftMargin, currentY, {
      fontSize: 10,
      maxWidth: pageWidth - 40
    });
    currentY += 20;
  }

  // Signatures
  const signatureY = currentY + 30;
  doc.line(leftMargin + 20, signatureY, leftMargin + 80, signatureY);
  doc.line(pageWidth - 100, signatureY, pageWidth - 40, signatureY);
  
  addSerbianText(doc, 'Iznajmljivac', leftMargin + 40, signatureY + 10, {
    fontSize: 10,
    align: 'center'
  });
  
  addSerbianText(doc, 'Klijent', pageWidth - 80, signatureY + 10, {
    fontSize: 10,
    align: 'center'
  });
}

export async function generateContract(
  data: ContractData, 
  template: ContractTemplate,
  clientDetails?: ClientDetails,
  rentalDetails?: RentalDetails
): Promise<Buffer> {
  const doc = new jsPDF();
  
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
              doc.addImage(dataUrl, 'JPEG', doc.internal.pageSize.getWidth() - 60, 10, 40, 40);
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
      generateJandraStyleContract(doc, data, template, clientDetails, rentalDetails);
    } else {
      generateSimpleContract(doc, data, template);
    }
    
    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF contract');
  }
}