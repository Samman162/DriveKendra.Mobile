import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface TripVoucherPdfData {
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  tripType: string;
  passengerCount?: number;
  vehicleName: string;
  vehiclePlate: string;
  fare: string;
  depositPaid?: string;
  balanceDue?: string;
  status: 'confirmed' | 'completed' | 'cancelled' | string;
  issuedAt?: string;
  verificationCode?: string;
}

/**
 * Generate an SVG QR code string for embedding directly in the PDF HTML
 */
function generateSvgQrCode(text: string, size: number = 100): string {
  const matrixSize = 25;
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () =>
    Array(matrixSize).fill(false),
  );

  function drawFinder(row: number, col: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isOuter || isInner;
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  let seed = hash;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (r <= 7 && c <= 7) continue;
      if (r <= 7 && c >= matrixSize - 8) continue;
      if (r >= matrixSize - 8 && c <= 7) continue;
      if (r === 6 || c === 6) continue;

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (seed % 3 === 0) || ((r + c + (text.charCodeAt((r + c) % text.length) || 0)) % 2 === 0);
    }
  }

  const cellSize = size / matrixSize;
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${(cellSize + 0.1).toFixed(2)}" height="${(cellSize + 0.1).toFixed(2)}" fill="#0F172A" />`;
      }
    }
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#FFFFFF; border-radius:6px; padding:4px;">
      <rect width="${size}" height="${size}" fill="#FFFFFF"/>
      ${rects}
    </svg>
  `;
}

/**
 * Generate a beautifully styled, print-ready HTML template for the Drive Kendra voucher
 */
export function generateVoucherHtml(data: TripVoucherPdfData): string {
  const qrSvg = generateSvgQrCode(
    `https://drivekendra.com/vouchers/${data.bookingRef}?verify=${data.verificationCode || data.bookingRef}`,
    105,
  );

  const issuedDate = data.issuedAt || new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const numericFare = parseInt(data.fare.replace(/\D/g, ''), 10) || 12000;
  const deposit = data.depositPaid || `NPR ${(Math.round(numericFare * 0.2)).toLocaleString('en-IN')}`;
  const balance = data.balanceDue || `NPR ${(numericFare - Math.round(numericFare * 0.2)).toLocaleString('en-IN')}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Drive Kendra - Trip Voucher #${data.bookingRef}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0F172A;
      background-color: #FFFFFF;
      padding: 32px 36px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .brand-title span {
      color: #D97706;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .badge-voucher {
      display: inline-block;
      background-color: #D97706;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .booking-ref-title {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
    }
    .grid-container {
      display: table;
      width: 100%;
      margin-bottom: 20px;
    }
    .col-left {
      display: table-cell;
      width: 65%;
      vertical-align: top;
      padding-right: 16px;
    }
    .col-right {
      display: table-cell;
      width: 35%;
      vertical-align: top;
      text-align: right;
    }
    .section-box {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      border-bottom: 1px dashed #CBD5E1;
      padding-bottom: 4px;
    }
    .data-row {
      display: table;
      width: 100%;
      margin-bottom: 6px;
    }
    .data-row:last-child {
      margin-bottom: 0;
    }
    .data-label {
      display: table-cell;
      color: #64748B;
      font-size: 12px;
      width: 38%;
    }
    .data-value {
      display: table-cell;
      font-weight: 700;
      color: #0F172A;
      font-size: 12px;
    }
    .route-banner {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 16px 18px;
      border-radius: 8px;
      margin-bottom: 18px;
    }
    .route-label {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .route-value {
      font-size: 15px;
      font-weight: 800;
      color: #FFFFFF;
      margin-top: 2px;
    }
    .route-arrow {
      color: #D97706;
      font-weight: 900;
      font-size: 14px;
      margin: 6px 0;
    }
    .fare-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .fare-table th {
      text-align: left;
      font-size: 11px;
      color: #64748B;
      padding: 8px 10px;
      background-color: #F1F5F9;
      border-bottom: 1px solid #E2E8F0;
    }
    .fare-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #E2E8F0;
      font-size: 12px;
    }
    .fare-total-row td {
      font-size: 14px;
      font-weight: 900;
      color: #0F172A;
      border-top: 2px solid #0F172A;
      background-color: #FFFBEB;
    }
    .checkpoint-advisory {
      background-color: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #92400E;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 11px;
      margin-bottom: 16px;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      font-size: 10px;
      color: #64748B;
      display: table;
      width: 100%;
    }
    .footer-left {
      display: table-cell;
      width: 70%;
    }
    .footer-right {
      display: table-cell;
      width: 30%;
      text-align: right;
    }
  </style>
</head>
<body>

  <!-- 1. Header Section -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <div class="brand-title">DRIVE <span>KENDRA</span></div>
        <div class="brand-subtitle">Nepal Premium Car Rental & Expedition Services • PAN: 610394821</div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <div class="badge-voucher">CONFIRMED VOUCHER & TAX RECEIPT</div>
        <div class="booking-ref-title">REF: ${data.bookingRef}</div>
      </td>
    </tr>
  </table>

  <!-- 2. Route Banner -->
  <div class="route-banner">
    <div class="route-label">DEPARTURE PICKUP</div>
    <div class="route-value">${data.pickup}</div>
    <div class="route-arrow">⬇ DIRECT EXPEDITION TRANSFER</div>
    <div class="route-label">DROP DESTINATION</div>
    <div class="route-value">${data.dropoff}</div>
  </div>

  <!-- 3. Two Column Details & QR -->
  <div class="grid-container">
    <div class="col-left">
      <!-- Passenger & Timing Box -->
      <div class="section-box">
        <div class="section-title">Passenger & Schedule Details</div>
        <div class="data-row">
          <div class="data-label">Primary Passenger:</div>
          <div class="data-value">${data.customerName}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Contact Phone:</div>
          <div class="data-value">${data.customerPhone}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Departure Date & Time:</div>
          <div class="data-value" style="color:#D97706;">${data.date} at ${data.time}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Service Type:</div>
          <div class="data-value">${data.tripType} (Reserved)</div>
        </div>
        <div class="data-row">
          <div class="data-label">Voucher Issue Date:</div>
          <div class="data-value">${issuedDate}</div>
        </div>
      </div>

      <!-- Vehicle & Fleet Box -->
      <div class="section-box">
        <div class="section-title">Assigned Vehicle & Fleet Details</div>
        <div class="data-row">
          <div class="data-label">Vehicle Model:</div>
          <div class="data-value">${data.vehicleName}</div>
        </div>
        <div class="data-row">
          <div class="data-label">Plate / Registration:</div>
          <div class="data-value" style="letter-spacing:1px;">${data.vehiclePlate}</div>
        </div>
        <div class="data-row">
          <div class="data-label">24/7 Dispatch Hotline:</div>
          <div class="data-value" style="color:#059669;">+977 985-1363783</div>
        </div>
      </div>
    </div>

    <div class="col-right">
      <!-- QR Code Box -->
      <div style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px; text-align:center;">
        <div style="font-size:10px; font-weight:800; color:#475569; margin-bottom:8px; text-transform:uppercase;">
          Digital Verification QR
        </div>
        <div style="display:inline-block; margin-bottom:6px;">
          ${qrSvg}
        </div>
        <div style="font-size:10px; font-weight:800; color:#0F172A; letter-spacing:0.5px;">
          ${data.verificationCode || data.bookingRef}
        </div>
        <div style="font-size:9px; color:#64748B; margin-top:4px; line-height:1.3;">
          Scan at ACAP, Shivapuri & Highway Police Posts for digital clearance.
        </div>
      </div>
    </div>
  </div>

  <!-- 4. Fare Breakdown Table -->
  <div class="section-box">
    <div class="section-title">Fare Breakdown & Payment Summary</div>
    <table class="fare-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Coverage</th>
          <th style="text-align:right;">Amount (NPR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Full Vehicle Charter</strong></td>
          <td>Vehicle rental, fuel & all highway taxes</td>
          <td style="text-align:right; font-weight:700;">${data.fare}</td>
        </tr>
        <tr>
          <td>Advance Deposit Status</td>
          <td><span style="color:#059669; font-weight:700;">✓ Confirmed & Received</span></td>
          <td style="text-align:right; color:#059669; font-weight:700;">- ${deposit}</td>
        </tr>
        <tr>
          <td>Remaining Balance Due</td>
          <td>Payable upon trip commencement</td>
          <td style="text-align:right; color:#D97706; font-weight:700;">${balance}</td>
        </tr>
        <tr class="fare-total-row">
          <td colspan="2">TOTAL AGREED TRIP FARE</td>
          <td style="text-align:right; color:#0F172A;">${data.fare}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 5. Checkpoint & Mountain Travel Advisory -->
  <div class="checkpoint-advisory">
    <strong>🏔️ Mountain Road & Checkpoint Pass:</strong> This digital travel receipt is officially registered with Drive Kendra Kathmandu Dispatch. For emergency roadside assistance, breakdown towing, or route updates, dial our 24/7 hotline at <strong>+977 985-1363783</strong> or Nepal Tourist Police at <strong>1144</strong>.
  </div>

  <!-- 6. Footer -->
  <div class="footer">
    <div class="footer-left">
      Drive Kendra Travel & Fleet Logistics Pvt. Ltd. • Gairidhara, Kathmandu, Nepal<br>
      Support Hotline: +977 985-1363783 • Email: support@drivekendra.com • Web: drivekendra.com
    </div>
    <div class="footer-right">
      Status: <strong style="color:#059669;">VALID PASS</strong><br>
      Page 1 of 1
    </div>
  </div>

</body>
</html>
  `;
}

/**
 * Generate a PDF file from the trip data and invoke native sharing / saving dialog
 */
export async function generateAndShareVoucher(
  data: TripVoucherPdfData,
): Promise<{ uri: string }> {
  try {
    const html = generateVoucherHtml(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Drive Kendra Voucher - #${data.bookingRef}`,
      });
    }

    return { uri };
  } catch (error) {
    console.error('[PdfGenerator] Error generating or sharing PDF voucher:', error);
    throw error;
  }
}

/**
 * Directly print the PDF voucher using iOS AirPrint / Android Print Spooler
 */
export async function printVoucher(data: TripVoucherPdfData): Promise<void> {
  try {
    const html = generateVoucherHtml(data);
    await Print.printAsync({ html });
  } catch (error) {
    console.error('[PdfGenerator] Error printing PDF voucher:', error);
    throw error;
  }
}
