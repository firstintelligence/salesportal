import jsPDF from 'jspdf';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const safeNumber = (val) => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const calculateDealMetrics = (dealData) => {
  const dealSize = safeNumber(dealData.dealSize);
  const equipmentCost = safeNumber(dealData.equipmentCost);
  const laborCost = safeNumber(dealData.laborCost);
  const extras = safeNumber(dealData.extras);
  const dealerFee = safeNumber(dealData.dealerFee);
  const contractorFee = safeNumber(dealData.contractorFee);
  const commission = safeNumber(dealData.commission);
  const marketingFee = safeNumber(dealData.marketingFee);

  const dealerFeeCost = (dealSize * dealerFee) / 100;
  const amountAfterDealerFee = dealSize - dealerFeeCost;
  const contractorFeeCost = (amountAfterDealerFee * contractorFee) / 100;
  const commissionCost = (amountAfterDealerFee * commission) / 100;
  const marketingFeeCost = (amountAfterDealerFee * marketingFee) / 100;
  
  const fixedCosts = equipmentCost + laborCost + extras;
  const variableCosts = dealerFeeCost + contractorFeeCost + commissionCost + marketingFeeCost;
  const totalCosts = fixedCosts + variableCosts;
  
  const grossProfit = dealSize - totalCosts;
  const profitMargin = dealSize > 0 ? (grossProfit / dealSize) * 100 : 0;

  return {
    dealSize, equipmentCost, laborCost, extras,
    dealerFeeCost, contractorFeeCost, commissionCost, marketingFeeCost,
    fixedCosts, variableCosts, totalCosts, grossProfit, profitMargin,
  };
};

export const generateProfitCalculatorPDF = (dealData, dealNumber, productName = 'Custom Deal') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const metrics = calculateDealMetrics(dealData);
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  // Modern color palette matching the UI
  const colors = {
    // Gradient backgrounds
    indigo: [79, 70, 229],
    indigoLight: [129, 140, 248],
    purple: [124, 58, 237],
    teal: [20, 184, 166],
    green: [34, 197, 94],
    emerald: [16, 185, 129],
    amber: [245, 158, 11],
    red: [239, 68, 68],
    pink: [236, 72, 153],
    cyan: [6, 182, 212],
    
    // Neutrals
    slate900: [15, 23, 42],
    slate800: [30, 41, 59],
    slate700: [51, 65, 85],
    slate600: [71, 85, 105],
    slate500: [100, 116, 139],
    slate400: [148, 163, 184],
    slate300: [203, 213, 225],
    slate200: [226, 232, 240],
    slate100: [241, 245, 249],
    slate50: [248, 250, 252],
    white: [255, 255, 255],
    
    // Background gradient colors
    bgLight: [238, 242, 255],
    bgMid: [224, 231, 255],
  };

  // Fill page with gradient-like background
  doc.setFillColor(...colors.bgLight);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add subtle gradient overlay
  doc.setFillColor(...colors.bgMid);
  doc.rect(0, 0, pageWidth, 60, 'F');

  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let y = margin;

  // ══════════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════════
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate800);
  doc.text('Profit Analysis', margin, y + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate500);
  doc.text(dateStr, pageWidth - margin, y + 8, { align: 'right' });
  
  // Product badge
  y += 16;
  doc.setFillColor(...colors.indigo);
  doc.roundedRect(margin, y, 60, 8, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(productName, margin + 5, y + 5.5);
  
  y += 16;

  // ══════════════════════════════════════════════════════════════════════
  // KEY METRICS - Three cards
  // ══════════════════════════════════════════════════════════════════════
  const cardGap = 6;
  const cardW = (contentWidth - cardGap * 2) / 3;
  const cardH = 38;
  
  // Revenue Card (Indigo gradient)
  let cardX = margin;
  doc.setFillColor(...colors.indigo);
  doc.roundedRect(cardX, y, cardW, cardH, 4, 4, 'F');
  doc.setFillColor(...colors.indigoLight);
  doc.roundedRect(cardX + cardW - 25, y + 5, 20, 12, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.8);
  doc.text('Revenue', cardX + 8, y + 12);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(formatCurrency(metrics.dealSize), cardX + 8, y + 28);
  
  // Total Costs Card (White)
  cardX = margin + cardW + cardGap;
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, y, cardW, cardH, 4, 4, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate500);
  doc.text('Total Costs', cardX + 8, y + 12);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate800);
  doc.text(formatCurrency(metrics.totalCosts), cardX + 8, y + 28);
  
  // Net Profit Card (Green/Red gradient)
  cardX = margin + (cardW + cardGap) * 2;
  const profitColor = metrics.grossProfit >= 0 ? colors.emerald : colors.red;
  doc.setFillColor(...profitColor);
  doc.roundedRect(cardX, y, cardW, cardH, 4, 4, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.8);
  doc.text('Net Profit', cardX + 8, y + 12);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(formatCurrency(metrics.grossProfit), cardX + 8, y + 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${metrics.profitMargin.toFixed(1)}% margin`, cardX + 8, y + 35);
  
  y += cardH + 10;

  // ══════════════════════════════════════════════════════════════════════
  // TWO COLUMN LAYOUT - Costs & Chart
  // ══════════════════════════════════════════════════════════════════════
  const colGap = 8;
  const colW = (contentWidth - colGap) / 2;
  const colH = 70;
  
  // Fixed Costs Card
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.slate200);
  doc.roundedRect(margin, y, colW, colH, 4, 4, 'FD');
  
  doc.setFillColor(...colors.indigo);
  doc.circle(margin + 10, y + 12, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate700);
  doc.text('Fixed Costs', margin + 16, y + 14);
  doc.setTextColor(...colors.indigo);
  doc.text(formatCurrency(metrics.fixedCosts), margin + colW - 8, y + 14, { align: 'right' });
  
  const fixedItems = [
    { label: 'Equipment', value: metrics.equipmentCost, color: colors.indigo },
    { label: 'Labor', value: metrics.laborCost, color: colors.teal },
    { label: 'Extras/Materials', value: metrics.extras, color: colors.purple },
  ];
  
  let itemY = y + 26;
  const barMaxW = colW - 55;
  fixedItems.forEach((item, index) => {
    const pct = metrics.fixedCosts > 0 ? (item.value / metrics.fixedCosts) * 100 : 0;
    
    doc.setFillColor(...item.color);
    doc.circle(margin + 10, itemY, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slate600);
    doc.text(item.label, margin + 16, itemY + 1.5);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.slate700);
    doc.text(formatCurrency(item.value), margin + colW - 8, itemY + 1.5, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.slate100);
    doc.roundedRect(margin + 10, itemY + 5, barMaxW, 4, 2, 2, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(margin + 10, itemY + 5, Math.max(4, (pct / 100) * barMaxW), 4, 2, 2, 'F');
    }
    
    itemY += 16;
  });
  
  // Variable Costs Card
  const varX = margin + colW + colGap;
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.slate200);
  doc.roundedRect(varX, y, colW, colH, 4, 4, 'FD');
  
  doc.setFillColor(...colors.amber);
  doc.circle(varX + 10, y + 12, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate700);
  doc.text('Variable Costs', varX + 16, y + 14);
  doc.setTextColor(...colors.amber);
  doc.text(formatCurrency(metrics.variableCosts), varX + colW - 8, y + 14, { align: 'right' });
  
  const varItems = [
    { label: `Dealer Fee (${dealData.dealerFee}%)`, value: metrics.dealerFeeCost, color: colors.amber },
    { label: `Contractor (${dealData.contractorFee}%)`, value: metrics.contractorFeeCost, color: colors.pink },
    { label: `Commission (${dealData.commission}%)`, value: metrics.commissionCost, color: colors.green },
    { label: `Marketing (${dealData.marketingFee}%)`, value: metrics.marketingFeeCost, color: colors.cyan },
  ];
  
  itemY = y + 24;
  varItems.forEach((item) => {
    const pct = metrics.variableCosts > 0 ? (item.value / metrics.variableCosts) * 100 : 0;
    
    doc.setFillColor(...item.color);
    doc.circle(varX + 10, itemY, 1.5, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slate600);
    doc.text(item.label, varX + 16, itemY + 1);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.slate700);
    doc.text(formatCurrency(item.value), varX + colW - 8, itemY + 1, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.slate100);
    doc.roundedRect(varX + 10, itemY + 4, barMaxW, 3, 1.5, 1.5, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(varX + 10, itemY + 4, Math.max(3, (pct / 100) * barMaxW), 3, 1.5, 1.5, 'F');
    }
    
    itemY += 12;
  });
  
  y += colH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // COST DISTRIBUTION BAR
  // ══════════════════════════════════════════════════════════════════════
  const distH = 42;
  
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.slate200);
  doc.roundedRect(margin, y, contentWidth, distH, 4, 4, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate700);
  doc.text('Cost Distribution', margin + 10, y + 12);
  
  // Stacked bar
  const barY = y + 18;
  const barH = 10;
  const barW = contentWidth - 20;
  
  const allCosts = [
    { value: metrics.equipmentCost, color: colors.indigo, label: 'Equipment' },
    { value: metrics.laborCost, color: colors.teal, label: 'Labor' },
    { value: metrics.extras, color: colors.purple, label: 'Extras' },
    { value: metrics.dealerFeeCost, color: colors.amber, label: 'Dealer' },
    { value: metrics.contractorFeeCost, color: colors.pink, label: 'Contractor' },
    { value: metrics.commissionCost, color: colors.green, label: 'Commission' },
    { value: metrics.marketingFeeCost, color: colors.cyan, label: 'Marketing' },
  ];
  
  // Background
  doc.setFillColor(...colors.slate100);
  doc.roundedRect(margin + 10, barY, barW, barH, 5, 5, 'F');
  
  // Draw segments
  let barX = margin + 10;
  const activeCosts = allCosts.filter(c => c.value > 0);
  activeCosts.forEach((cost, i) => {
    if (metrics.totalCosts > 0) {
      const segW = (cost.value / metrics.totalCosts) * barW;
      doc.setFillColor(...cost.color);
      
      if (i === 0) {
        doc.roundedRect(barX, barY, segW + 3, barH, 5, 5, 'F');
        doc.rect(barX + segW - 3, barY, 6, barH, 'F');
      } else if (i === activeCosts.length - 1) {
        doc.roundedRect(barX - 3, barY, segW + 3, barH, 5, 5, 'F');
        doc.rect(barX - 3, barY, 6, barH, 'F');
      } else {
        doc.rect(barX, barY, segW, barH, 'F');
      }
      barX += segW;
    }
  });
  
  // Legend
  let legendX = margin + 10;
  const legendY = y + 35;
  activeCosts.forEach((cost) => {
    doc.setFillColor(...cost.color);
    doc.roundedRect(legendX, legendY, 6, 4, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slate500);
    const pctStr = `${cost.label} ${((cost.value / metrics.totalCosts) * 100).toFixed(0)}%`;
    doc.text(pctStr, legendX + 8, legendY + 3);
    legendX += doc.getTextWidth(pctStr) + 14;
  });
  
  y += distH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // PROFIT MARGIN GAUGE
  // ══════════════════════════════════════════════════════════════════════
  const gaugeH = 50;
  
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.slate200);
  doc.roundedRect(margin, y, contentWidth, gaugeH, 4, 4, 'FD');
  
  // Gauge on left
  const gaugeCX = margin + 45;
  const gaugeCY = y + 38;
  const gaugeR = 25;
  
  // Background arc
  doc.setDrawColor(...colors.slate200);
  doc.setLineWidth(5);
  for (let i = 0; i < 60; i++) {
    const angle1 = Math.PI + (i / 60) * Math.PI;
    const angle2 = Math.PI + ((i + 1) / 60) * Math.PI;
    doc.line(
      gaugeCX + gaugeR * Math.cos(angle1), gaugeCY + gaugeR * Math.sin(angle1),
      gaugeCX + gaugeR * Math.cos(angle2), gaugeCY + gaugeR * Math.sin(angle2)
    );
  }
  
  // Progress arc
  const marginPct = Math.min(100, Math.max(0, metrics.profitMargin * 2));
  const progressColor = metrics.profitMargin >= 20 ? colors.green : 
                        metrics.profitMargin >= 10 ? colors.amber : colors.red;
  doc.setDrawColor(...progressColor);
  doc.setLineWidth(5);
  const segments = Math.floor((marginPct / 100) * 60);
  for (let i = 0; i < segments; i++) {
    const angle1 = Math.PI + (i / 60) * Math.PI;
    const angle2 = Math.PI + ((i + 1) / 60) * Math.PI;
    doc.line(
      gaugeCX + gaugeR * Math.cos(angle1), gaugeCY + gaugeR * Math.sin(angle1),
      gaugeCX + gaugeR * Math.cos(angle2), gaugeCY + gaugeR * Math.sin(angle2)
    );
  }
  
  // Center text
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  doc.text(`${metrics.profitMargin.toFixed(1)}%`, gaugeCX, gaugeCY - 5, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate500);
  doc.text('Margin', gaugeCX, gaugeCY + 3, { align: 'center' });
  
  // Right side - Analysis
  const rightX = margin + 90;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate800);
  doc.text('Profit Analysis', rightX, y + 16);
  
  // Status badge
  let statusText = '';
  let statusBg = colors.green;
  if (metrics.profitMargin >= 25) { statusText = 'Excellent'; statusBg = colors.green; }
  else if (metrics.profitMargin >= 15) { statusText = 'Good'; statusBg = colors.indigo; }
  else if (metrics.profitMargin >= 5) { statusText = 'Moderate'; statusBg = colors.amber; }
  else { statusText = 'Low'; statusBg = colors.red; }
  
  doc.setFillColor(...statusBg);
  doc.roundedRect(rightX, y + 20, 28, 7, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text(statusText, rightX + 14, y + 25, { align: 'center' });
  
  // Summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate600);
  doc.text(`Revenue: ${formatCurrency(metrics.dealSize)}`, rightX, y + 36);
  doc.text(`Costs: ${formatCurrency(metrics.totalCosts)}`, rightX + 50, y + 36);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  doc.text(`Profit: ${formatCurrency(metrics.grossProfit)}`, rightX, y + 44);
  
  y += gaugeH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // FINANCIAL SUMMARY CARD
  // ══════════════════════════════════════════════════════════════════════
  const summaryH = 28;
  
  doc.setFillColor(...colors.slate800);
  doc.roundedRect(margin, y, contentWidth, summaryH, 4, 4, 'F');
  
  const sumItems = [
    { value: formatCurrency(metrics.dealSize), label: 'Revenue', color: colors.white },
    { value: '−', isOp: true },
    { value: formatCurrency(metrics.totalCosts), label: 'Costs', color: colors.amber },
    { value: '=', isOp: true },
    { value: formatCurrency(metrics.grossProfit), label: 'Profit', color: metrics.grossProfit >= 0 ? colors.emerald : colors.red },
  ];
  
  const itemWidth = contentWidth / 5;
  sumItems.forEach((item, i) => {
    const itemX = margin + itemWidth * i + itemWidth / 2;
    
    if (item.isOp) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.slate400);
      doc.text(item.value, itemX, y + 16, { align: 'center' });
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, itemX, y + 14, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.slate400);
      doc.text(item.label, itemX, y + 22, { align: 'center' });
    }
  });

  // ══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════
  const footerY = pageHeight - margin - 4;
  
  doc.setDrawColor(...colors.slate300);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate400);
  doc.text('Generated by Profit Calculator', margin, footerY);
  doc.text(dateStr, pageWidth - margin, footerY, { align: 'right' });

  // Save
  const fileName = `profit-analysis-${productName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
