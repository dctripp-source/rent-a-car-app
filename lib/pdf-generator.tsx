// lib/pdf-generator.ts - Kompletna zamjena
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
  contract_style?: string; // Ignorišemo ovo - koristimo samo jedan stil
  include_km_fields?: boolean;
  include_driver_license?: boolean;
  include_id_details?: boolean;
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

// Kompletna klasa za upravljanje PDF dokumentom
class UniversalPDFGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageHeight: number;
  private pageWidth: number;
  private leftMargin: number;
  private rightMargin: number;
  private bottomMargin: number;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 25;
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.leftMargin = 20;
    this.rightMargin = 20;
    this.bottomMargin = 25;
  }

  private checkPageBreak(requiredSpace: number = 15): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.bottomMargin) {
      this.doc.addPage();
      this.currentY = 25;
    }
  }

  private convertSerbianText(text: string): string {
    return text
      .replace(/č/g, 'c').replace(/ć/g, 'c').replace(/đ/g, 'd')
      .replace(/š/g, 's').replace(/ž/g, 'z')
      .replace(/Č/g, 'C').replace(/Ć/g, 'C').replace(/Đ/g, 'D')
      .replace(/Š/g, 'S').replace(/Ž/g, 'Z');
  }

  private addCenteredTitle(text: string, fontSize: number = 16, fontWeight: 'normal' | 'bold' = 'bold'): void {
    this.checkPageBreak(fontSize + 5);
    this.doc.setFontSize(fontSize);
    this.doc.setFont(undefined, fontWeight);
    
    const convertedText = this.convertSerbianText(text);
    this.doc.text(convertedText, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += fontSize * 0.5 + 5;
  }

  private addText(
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

    const serbianText = this.convertSerbianText(text);

    if (text.length > 50 || maxWidth < this.pageWidth - 40) {
      const lines = this.doc.splitTextToSize(serbianText, maxWidth);
      const totalHeight = lines.length * (fontSize * 0.35);
      
      if (useAutoY) {
        this.checkPageBreak(totalHeight + 5);
      }
      
      this.doc.text(lines, x, y || this.currentY, { align });
      
      if (useAutoY) {
        this.currentY += totalHeight + 5;
      }
      
      return totalHeight;
    } else {
      if (useAutoY) {
        this.checkPageBreak(fontSize * 0.35 + 3);
      }
      
      this.doc.text(serbianText, x, y || this.currentY, { align });
      
      if (useAutoY) {
        this.currentY += fontSize * 0.35 + 5;
      }
      
      return fontSize * 0.35;
    }
  }

  private addCompanyHeader(template: ContractTemplate): void {
    // Company info - desno poravnano
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    
    const companyText = this.convertSerbianText(template.company_name);
    this.doc.text(companyText, this.pageWidth - this.rightMargin, 20, { align: 'right' });

    this.doc.setFontSize(9);
    this.doc.setFont(undefined, 'normal');

    let rightY = 32;
    if (template.company_address) {
      this.doc.text(this.convertSerbianText(template.company_address), this.pageWidth - this.rightMargin, rightY, { align: 'right' });
      rightY += 6;
    }
    if (template.company_phone) {
      this.doc.text(this.convertSerbianText(`Tel: ${template.company_phone}`), this.pageWidth - this.rightMargin, rightY, { align: 'right' });
      rightY += 6;
    }
    if (template.company_email) {
      this.doc.text(this.convertSerbianText(`Email: ${template.company_email}`), this.pageWidth - this.rightMargin, rightY, { align: 'right' });
      rightY += 6;
    }
    if (template.jib_number) {
      this.doc.text(this.convertSerbianText(`JIB: ${template.jib_number}`), this.pageWidth - this.rightMargin, rightY, { align: 'right' });
      rightY += 6;
    }
    if (template.bank_account) {
      this.doc.text(this.convertSerbianText(`Ziro racun: ${template.bank_account}`), this.pageWidth - this.rightMargin, rightY, { align: 'right' });
    }

    this.currentY = Math.max(this.currentY, rightY + 15);
  }

  private addInfoTable(data: ContractData, template: ContractTemplate): void {
    this.checkPageBreak(100);

    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Definišemo tabelu podataka
    const tableData = [
      ['Ime i prezime korisnika:', data.client_name],
      ['Adresa korisnika:', data.client_address || ''],
      ['Telefon korisnika:', data.client_phone || ''],
      ['Email korisnika:', data.client_email],
      ['Broj licne karte:', data.client_id_number || ''],
      ['', ''], // Razmak
      ['Vozilo:', `${data.brand} ${data.model} (${data.year})`],
      ['Registarske oznake:', data.registration_number],
      ['', ''], // Razmak
      ['Datum pocetka najma:', format(startDate, 'dd.MM.yyyy')],
      ['Datum zavrsetka najma:', format(endDate, 'dd.MM.yyyy')],
      ['Broj dana:', days.toString()],
      ['Cijena po danu:', `${data.daily_rate.toFixed(2)} KM`],
      ['', ''], // Razmak
      ['UKUPNA CIJENA:', `${data.total_price.toFixed(2)} KM`]
    ];

    // Centrirana tabela
    const tableWidth = 140;
    const tableX = (this.pageWidth - tableWidth) / 2;
    const rowHeight = 8;
    const col1Width = tableWidth * 0.55;
    const col2Width = tableWidth * 0.45;

    this.doc.setLineWidth(0.3);

    tableData.forEach((row, index) => {
      this.checkPageBreak(rowHeight + 3);

      const isEmptyRow = row[0] === '' && row[1] === '';
      const isTotalRow = row[0] === 'UKUPNA CIJENA:';

      if (isEmptyRow) {
        this.currentY += 5;
        return;
      }

      // Background za total red
      if (isTotalRow) {
        this.doc.setFillColor(230, 230, 230);
        this.doc.rect(tableX, this.currentY - 2, tableWidth, rowHeight + 4, 'F');
      }

      // Borderi
      this.doc.rect(tableX, this.currentY - 2, col1Width, rowHeight + 4);
      this.doc.rect(tableX + col1Width, this.currentY - 2, col2Width, rowHeight + 4);

      // Tekst
      this.doc.setFontSize(9);
      this.doc.setFont(undefined, isTotalRow ? 'bold' : 'normal');

      const label = this.convertSerbianText(row[0]);
      const value = this.convertSerbianText(row[1]);

      // Wrap text if too long
      const labelLines = this.doc.splitTextToSize(label, col1Width - 6);
      const valueLines = this.doc.splitTextToSize(value, col2Width - 6);

      if (Array.isArray(labelLines)) {
        labelLines.forEach((line: string, i: number) => {
          this.doc.text(line, tableX + 3, this.currentY + 3 + (i * 4));
        });
      } else {
        this.doc.text(labelLines, tableX + 3, this.currentY + 3);
      }

      if (Array.isArray(valueLines)) {
        valueLines.forEach((line: string, i: number) => {
          this.doc.text(line, tableX + col1Width + 3, this.currentY + 3 + (i * 4));
        });
      } else {
        this.doc.text(valueLines, tableX + col1Width + 3, this.currentY + 3);
      }

      const maxLines = Math.max(
        Array.isArray(labelLines) ? labelLines.length : 1,
        Array.isArray(valueLines) ? valueLines.length : 1
      );

      this.currentY += (maxLines * 4) + 4;
    });

    this.currentY += 15;
  }

  private addTermsSection(template: ContractTemplate): void {
    this.checkPageBreak(30);

    // Naslov sekcije
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(this.convertSerbianText('USLOVI UGOVORA'), this.leftMargin, this.currentY);
    this.currentY += 15;

    // Uslovi iz template-a
    if (template.contract_terms) {
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'normal');

      const processedTerms = template.contract_terms.replace(
        /\{penalty_rate\}/g, 
        template.penalty_rate.toString()
      );

      const maxWidth = this.pageWidth - this.leftMargin - this.rightMargin;
      
      // Split by paragraphs
      const paragraphs = processedTerms.split('\n').filter(p => p.trim().length > 0);

      paragraphs.forEach(paragraph => {
        this.checkPageBreak(15);
        
        const lines = this.doc.splitTextToSize(this.convertSerbianText(paragraph.trim()), maxWidth);
        
        if (Array.isArray(lines)) {
          lines.forEach((line: string) => {
            this.checkPageBreak(8);
            this.doc.text(line, this.leftMargin, this.currentY);
            this.currentY += 6;
          });
        } else {
          this.doc.text(lines, this.leftMargin, this.currentY);
          this.currentY += 6;
        }
        
        this.currentY += 4; // Space between paragraphs
      });

      this.currentY += 10;
    }

    // Fuel policy ako postoji
    if (template.fuel_policy) {
      this.checkPageBreak(20);
      
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'italic');

      const maxWidth = this.pageWidth - this.leftMargin - this.rightMargin;
      const lines = this.doc.splitTextToSize(this.convertSerbianText(template.fuel_policy), maxWidth);

      if (Array.isArray(lines)) {
        lines.forEach((line: string) => {
          this.checkPageBreak(8);
          this.doc.text(line, this.leftMargin, this.currentY);
          this.currentY += 6;
        });
      } else {
        this.doc.text(lines, this.leftMargin, this.currentY);
        this.currentY += 6;
      }

      this.currentY += 15;
    }
  }

  private addSignatureSection(data: ContractData, template: ContractTemplate): void {
    this.checkPageBreak(70);

    // Datum i mjesto
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    const dateText = `Datum: ${format(new Date(), 'dd.MM.yyyy')}`;
    this.doc.text(this.convertSerbianText(dateText), this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 25;

    // Signature lines
    const signatureY = this.currentY + 25;
    const leftSignX = this.leftMargin + 30;
    const rightSignX = this.pageWidth - this.rightMargin - 70;

    // Crtamo linije za potpis
    this.doc.setLineWidth(0.5);
    this.doc.line(leftSignX, signatureY, leftSignX + 70, signatureY);
    this.doc.line(rightSignX, signatureY, rightSignX + 70, signatureY);

    // Labels za potpise
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');

    this.doc.text(this.convertSerbianText('Iznajmljivac'), leftSignX + 35, signatureY + 8, { align: 'center' });
    this.doc.text(this.convertSerbianText('Korisnik'), rightSignX + 35, signatureY + 8, { align: 'center' });

    // Imena ispod potpisa
    this.doc.setFontSize(8);
    this.doc.text(this.convertSerbianText(template.company_name), leftSignX + 35, signatureY + 16, { align: 'center' });
    this.doc.text(this.convertSerbianText(data.client_name), rightSignX + 35, signatureY + 16, { align: 'center' });

    this.currentY = signatureY + 25;
  }

  public async generateUniversalContract(
    data: ContractData,
    template: ContractTemplate,
    clientDetails?: ClientDetails,
    rentalDetails?: RentalDetails
  ): Promise<Buffer> {
    try {
      // 1. Company header (gore desno)
      this.addCompanyHeader(template);

      // 2. Glavni naslov (centriran)
      this.addCenteredTitle('UGOVOR O IZNAJMLJIVANJU VOZILA', 18);
      this.addCenteredTitle(`Broj: ${String(data.id).padStart(3, '0')}/${new Date().getFullYear()}`, 12, 'normal');

      this.currentY += 15;

      // 3. Tabela sa informacijama (centrirana)
      this.addInfoTable(data, template);

      // 4. Uslovi ugovora
      this.addTermsSection(template);

      // 5. Potpisi
      this.addSignatureSection(data, template);

      // 6. Dodaj logo ako postoji
      if (template.logo_url) {
        try {
          const response = await fetch(template.logo_url);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise<void>((resolve) => {
            reader.onload = () => {
              try {
                const dataUrl = reader.result as string;
                // Logo ide gore lijevo
                this.doc.addImage(dataUrl, 'JPEG', this.leftMargin, 15, 35, 35);
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

      // Convert to buffer
      const pdfOutput = this.doc.output('arraybuffer');
      return Buffer.from(pdfOutput);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF contract');
    }
  }
}

// Main export function - ova zamjenjuje sve postojeće funkcionalnosti
export async function generateContract(
  data: ContractData, 
  template: ContractTemplate,
  clientDetails?: ClientDetails,
  rentalDetails?: RentalDetails
): Promise<Buffer> {
  const generator = new UniversalPDFGenerator();
  return await generator.generateUniversalContract(data, template, clientDetails, rentalDetails);
}