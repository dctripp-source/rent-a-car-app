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
  const fontSize = options?.fontSize || 12;
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

  // Convert Serbian characters to proper encoding
  const serbianText = text
    .replace(/č/g, 'c')
    .replace(/ć/g, 'c')
    .replace(/đ/g, 'd')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/Č/g, 'C')
    .replace(/Ć/g, 'C')
    .replace(/Đ/g, 'D')
    .replace(/Š/g, 'S')
    .replace(/Ž/g, 'Z');

  if (maxWidth && text.length > 50) {
    // Split long text into multiple lines
    const lines = doc.splitTextToSize(serbianText, maxWidth);
    doc.text(lines, x, y, { align });
    return y + (lines.length * (fontSize * 0.35)); // Return new Y position
  } else {
    doc.text(serbianText, x, y, { align });
    return y + (fontSize * 0.35); // Return new Y position
  }
}

// Function to add a labeled row
function addLabeledRow(
  doc: jsPDF, 
  label: string, 
  value: string, 
  x: number, 
  y: number, 
  labelWidth: number = 50
): number {
  addSerbianText(doc, label, x, y, { fontStyle: 'bold' });
  addSerbianText(doc, value, x + labelWidth, y);
  return y + 7;
}

// Function to load and add image
async function addImageFromUrl(doc: jsPDF, imageUrl: string, x: number, y: number, width: number, height: number) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise<void>((resolve, reject) => {
      reader.onload = function() {
        try {
          const dataUrl = reader.result as string;
          doc.addImage(dataUrl, 'JPEG', x, y, width, height);
          resolve();
        } catch (error) {
          console.error('Error adding image:', error);
          resolve(); // Continue without image
        }
      };
      reader.onerror = () => {
        console.error('Error reading image');
        resolve(); // Continue without image
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return Promise.resolve(); // Continue without image
  }
}

export async function generateContract(
  data: ContractData, 
  template: ContractTemplate
): Promise<Buffer> {
  const doc = new jsPDF();
  let currentY = 20;

  // Page margins
  const leftMargin = 20;
  const rightMargin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - leftMargin - rightMargin;

  try {
    // Add logo if available
    if (template.logo_url) {
      try {
        await addImageFromUrl(doc, template.logo_url, pageWidth - 60, 10, 40, 40);
      } catch (error) {
        console.error('Error adding logo:', error);
      }
    }

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
    currentY += 5;

    currentY = addSerbianText(doc, `Datum: ${format(new Date(), 'dd.MM.yyyy')}`, pageWidth / 2, currentY, {
      fontSize: 12,
      align: 'center'
    });
    currentY += 20;

    // Section 1: Contracting Parties
    currentY = addSerbianText(doc, '1. UGOVORNE STRANE', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 10;

    // Landlord info
    currentY = addLabeledRow(doc, 'Iznajmljivac:', template.company_name, leftMargin, currentY, 35);
    currentY = addLabeledRow(doc, 'Adresa:', template.company_address, leftMargin, currentY, 35);
    
    if (template.company_phone) {
      currentY = addLabeledRow(doc, 'Telefon:', template.company_phone, leftMargin, currentY, 35);
    }
    
    if (template.company_email) {
      currentY = addLabeledRow(doc, 'Email:', template.company_email, leftMargin, currentY, 35);
    }

    currentY += 10;
    currentY = addSerbianText(doc, 'i', leftMargin, currentY, { fontStyle: 'bold' });
    currentY += 10;

    // Client info
    currentY = addLabeledRow(doc, 'Klijent:', data.client_name, leftMargin, currentY, 35);
    
    if (data.client_id_number) {
      currentY = addLabeledRow(doc, 'Broj licne karte:', data.client_id_number, leftMargin, currentY, 35);
    }
    
    if (data.client_address) {
      currentY = addLabeledRow(doc, 'Adresa:', data.client_address, leftMargin, currentY, 35);
    }
    
    currentY = addLabeledRow(doc, 'Email:', data.client_email, leftMargin, currentY, 35);
    
    if (data.client_phone) {
      currentY = addLabeledRow(doc, 'Telefon:', data.client_phone, leftMargin, currentY, 35);
    }

    currentY += 15;

    // Section 2: Subject of Contract
    currentY = addSerbianText(doc, '2. PREDMET UGOVORA', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 10;

    const vehicleInfo = `${data.brand} ${data.model} (${data.year})`;
    currentY = addLabeledRow(doc, 'Vozilo:', vehicleInfo, leftMargin, currentY, 35);
    currentY = addLabeledRow(doc, 'Registarski broj:', data.registration_number, leftMargin, currentY, 35);

    currentY += 15;

    // Section 3: Rental Period
    currentY = addSerbianText(doc, '3. PERIOD IZNAJMLJIVANJA', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 10;

    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    currentY = addLabeledRow(doc, 'Od:', format(startDate, 'dd.MM.yyyy'), leftMargin, currentY, 35);
    currentY = addLabeledRow(doc, 'Do:', format(endDate, 'dd.MM.yyyy'), leftMargin, currentY, 35);
    currentY = addLabeledRow(doc, 'Broj dana:', days.toString(), leftMargin, currentY, 35);

    currentY += 15;

    // Section 4: Price
    currentY = addSerbianText(doc, '4. CIJENA', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 10;

    currentY = addLabeledRow(doc, 'Cijena po danu:', `${data.daily_rate.toFixed(2)} KM`, leftMargin, currentY, 35);
    currentY = addLabeledRow(doc, 'Broj dana:', days.toString(), leftMargin, currentY, 35);
    
    // Highlight total price
    doc.setTextColor(0, 100, 200); // Blue color
    currentY = addLabeledRow(doc, 'UKUPNA CIJENA:', `${data.total_price.toFixed(2)} KM`, leftMargin, currentY, 35);
    doc.setTextColor(0, 0, 0); // Reset to black

    currentY += 15;

    // Check if we need a new page
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }

    // Section 5: Terms and Conditions
    currentY = addSerbianText(doc, '5. USLOVI KORISTENJA', leftMargin, currentY, {
      fontSize: 14,
      fontStyle: 'bold'
    });
    currentY += 10;

    // Process template terms and replace variables
    const processedTerms = template.contract_terms.replace(
      /\{penalty_rate\}/g, 
      template.penalty_rate.toString()
    );

    // Split terms into paragraphs and add them
    const paragraphs = processedTerms.split('\n').filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      currentY = addSerbianText(doc, paragraph.trim(), leftMargin, currentY, {
        fontSize: 10,
        maxWidth: contentWidth
      });
      currentY += 5;
    }

    currentY += 20;

    // Check if we need a new page for signatures
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    // Signature section
    const signatureY = currentY + 30;
    const leftSignatureX = leftMargin + 20;
    const rightSignatureX = pageWidth - rightMargin - 60;

    // Signature lines
    doc.line(leftSignatureX, signatureY, leftSignatureX + 60, signatureY);
    doc.line(rightSignatureX, signatureY, rightSignatureX + 60, signatureY);

    // Signature labels
    addSerbianText(doc, 'Iznajmljivac', leftSignatureX + 20, signatureY + 10, {
      fontSize: 10,
      align: 'center'
    });
    
    addSerbianText(doc, template.company_name, leftSignatureX + 20, signatureY + 18, {
      fontSize: 8,
      align: 'center'
    });

    addSerbianText(doc, 'Klijent', rightSignatureX + 20, signatureY + 10, {
      fontSize: 10,
      align: 'center'
    });
    
    addSerbianText(doc, data.client_name, rightSignatureX + 20, signatureY + 18, {
      fontSize: 8,
      align: 'center'
    });

    // Add footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    addSerbianText(doc, 'Novera Systems', pageWidth / 2, footerY, {
      fontSize: 8,
      align: 'center'
    });

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF contract');
  }
}