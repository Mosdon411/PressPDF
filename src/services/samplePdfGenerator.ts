import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates high-resolution canvas bitmap and converts to JPEG byte array
 */
async function generateHighResImage(
  width: number,
  height: number,
  theme: 'nature' | 'urban' | 'chart' | 'document'
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // Background gradient
  if (theme === 'nature') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f2027');
    grad.addColorStop(0.5, '#203a43');
    grad.addColorStop(1, '#2c5364');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw rich mountainous landscape contours
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const baseHeight = height * (0.4 + i * 0.12);
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseHeight);
      for (let x = 0; x <= width; x += 40) {
        const y = baseHeight - Math.sin((x + i * 150) * 0.008) * (60 + i * 20) - Math.cos((x * 0.015)) * 30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = `rgba(${16 + i * 12}, ${50 + i * 22}, ${70 + i * 28}, ${0.75 - i * 0.1})`;
      ctx.fill();
    }

    // Starry sparkles / fine detail points
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 120; s++) {
      const sx = (s * 97) % width;
      const sy = (s * 43) % (height * 0.45);
      const sr = (s % 3 === 0) ? 1.8 : 0.9;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme === 'urban') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1a1c29');
    grad.addColorStop(1, '#11131c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Architectural isometric grid lines
    ctx.strokeStyle = 'rgba(79, 130, 246, 0.25)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height * 0.4, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // High detail architectural blocks
    for (let b = 0; b < 8; b++) {
      const bx = 100 + b * 130;
      const bw = 90;
      const bh = 220 + (b % 4) * 60;
      const by = height - bh - 60;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.strokeRect(bx, by, bw, bh);

      // Lit windows
      for (let wx = bx + 10; wx < bx + bw - 10; wx += 16) {
        for (let wy = by + 15; wy < by + bh - 15; wy += 22) {
          ctx.fillStyle = ((wx + wy) % 5 === 0) ? '#fef08a' : 'rgba(100, 116, 139, 0.3)';
          ctx.fillRect(wx, wy, 8, 12);
        }
      }
    }
  } else if (theme === 'document') {
    // Scanned document look with paper texture and high density lines
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Subtle paper grain noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8;
      d[i] = Math.min(255, Math.max(0, d[i] + noise));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Legal header
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('NON-DISCLOSURE & PROPRIETARY MASTER AGREEMENT', 60, 90);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('DOCUMENT REF: NDA-2026-X88 · OFFICIAL REPOSITORY COPY', 60, 120);

    // Lines of legal clause text simulation
    ctx.fillStyle = '#334155';
    ctx.font = '13px sans-serif';
    for (let line = 0; line < 38; line++) {
      const ly = 160 + line * 22;
      ctx.fillRect(60, ly, width - 120 - ((line % 7) * 45), 9);
    }

    // Red official approval stamp
    ctx.save();
    ctx.translate(width - 240, height - 180);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 180, 70);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('VERIFIED ORIGINAL', 12, 30);
    ctx.font = '11px sans-serif';
    ctx.fillText('REGISTRATION: OK-9941', 12, 50);
    ctx.restore();
  } else {
    // Chart
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let y = 60; y < height - 60; y += 40) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
    }

    // High-resolution data curve
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    for (let x = 60; x <= width - 60; x += 15) {
      const val = Math.sin(x * 0.015) * 80 + Math.cos(x * 0.035) * 40 + (height * 0.5);
      if (x === 60) ctx.moveTo(x, val);
      else ctx.lineTo(x, val);
    }
    ctx.stroke();
  }

  // Convert canvas to JPEG blob with high quality (0.95) to produce realistically uncompressed baseline
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        const buffer = await blob.arrayBuffer();
        resolve(new Uint8Array(buffer));
      },
      'image/jpeg',
      0.95
    );
  });
}

/**
 * Generates a realistic high-resolution marketing brochure PDF (~4.5MB uncompressed)
 */
export async function createMarketingBrochurePdf(): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1: Cover with Hero image (1600 x 1000px embedded)
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const imgBytes1 = await generateHighResImage(1600, 1000, 'urban');
  const embeddedImg1 = await pdfDoc.embedJpg(imgBytes1);

  // Draw background image
  page1.drawImage(embeddedImg1, {
    x: 40,
    y: 350,
    width: 515,
    height: 320,
  });

  // Top wordmark
  page1.drawText('NEXUS ARCHITECTURE & ENGINEERING', {
    x: 40,
    y: 780,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page1.drawText('ANNUAL DESIGN PORTFOLIO · HIGH-DPI MASTER EDITION', {
    x: 40,
    y: 755,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Headline below image
  page1.drawText('Precision Infrastructure for High-Density Systems', {
    x: 40,
    y: 290,
    size: 22,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.18),
  });

  page1.drawText(
    'A comprehensive retrospective documenting structural optimizations, composite materials,\nand high-yield computational workflows deployed across multi-phase deployments.',
    {
      x: 40,
      y: 250,
      size: 11,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
      lineHeight: 16,
    }
  );

  page1.drawText('PAGE 01 · CONFIDENTIAL MASTER PROOF', {
    x: 40,
    y: 50,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  // Page 2: Landscape & Case Study (1600 x 1000px nature/structural image)
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const imgBytes2 = await generateHighResImage(1600, 1000, 'nature');
  const embeddedImg2 = await pdfDoc.embedJpg(imgBytes2);

  page2.drawText('Case Study 04: Alpine Hydro-Kinetic Foundation', {
    x: 40,
    y: 780,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page2.drawImage(embeddedImg2, {
    x: 40,
    y: 430,
    width: 515,
    height: 320,
  });

  page2.drawText('Key Performance Indicators & Environmental Integrity', {
    x: 40,
    y: 380,
    size: 14,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.22),
  });

  page2.drawText(
    'The hydro-kinetic turbine arrays maintain zero seismic vibrational resonance within\na 30km perimeter, exceeding ISO 9001 environmental sustainability parameters.',
    {
      x: 40,
      y: 345,
      size: 11,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
      lineHeight: 16,
    }
  );

  // Add chart image on page 2 bottom
  const chartBytes = await generateHighResImage(1400, 600, 'chart');
  const embeddedChart = await pdfDoc.embedJpg(chartBytes);
  page2.drawImage(embeddedChart, {
    x: 40,
    y: 110,
    width: 515,
    height: 200,
  });

  page2.drawText('PAGE 02 · ARCHIVAL SPECIFICATION', {
    x: 40,
    y: 50,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.65),
  });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes as unknown as BlobPart], 'Nexus_Architecture_Master_Brochure.pdf', {
    type: 'application/pdf',
  });
}

/**
 * Generates a realistic high-resolution scanned legal contract PDF (~3.2MB)
 */
export async function createScannedLegalContractPdf(): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  // Page 1: Scanned agreement
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const scanImg1 = await generateHighResImage(1600, 2260, 'document');
  const embeddedScan1 = await pdfDoc.embedJpg(scanImg1);

  page1.drawImage(embeddedScan1, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  // Page 2: Appendix scan
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const scanImg2 = await generateHighResImage(1600, 2260, 'document');
  const embeddedScan2 = await pdfDoc.embedJpg(scanImg2);

  page2.drawImage(embeddedScan2, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes as unknown as BlobPart], 'Scanned_Master_Agreement_300DPI.pdf', {
    type: 'application/pdf',
  });
}

/**
 * Generates a photo lookbook PDF
 */
export async function createPhotoLookbookPdf(): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
  const photo = await generateHighResImage(2000, 1200, 'urban');
  const embeddedPhoto = await pdfDoc.embedJpg(photo);

  page.drawImage(embeddedPhoto, {
    x: 30,
    y: 30,
    width: 781.89,
    height: 535.28,
  });

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes as unknown as BlobPart], 'Metropolitan_Facade_Photo_Lookbook.pdf', {
    type: 'application/pdf',
  });
}
