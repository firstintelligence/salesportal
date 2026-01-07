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
    dealSize,
    equipmentCost,
    laborCost,
    extras,
    dealerFeeCost,
    contractorFeeCost,
    commissionCost,
    marketingFeeCost,
    fixedCosts,
    variableCosts,
    totalCosts,
    grossProfit,
    profitMargin,
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
  const margin = 12.7;
  const contentWidth = pageWidth - (margin * 2);
  const maxY = pageHeight - margin - 8; // Leave space for footer
  
  // Premium color palette - modern gradients
  const colors = {
    // Dark theme accents
    navy: [17, 24, 39],
    charcoal: [31, 41, 55],
    
    // Vibrant accents
    electric: [99, 102, 241],    // Indigo
    emerald: [16, 185, 129],
    coral: [251, 113, 133],
    amber: [251, 191, 36],
    violet: [167, 139, 250],
    teal: [45, 212, 191],
    rose: [244, 63, 94],
    sky: [56, 189, 248],
    
    // Neutrals
    slate900: [15, 23, 42],
    slate700: [51, 65, 85],
    slate500: [100, 116, 139],
    slate400: [148, 163, 184],
    slate300: [203, 213, 225],
    slate100: [241, 245, 249],
    white: [255, 255, 255],
  };

  let y = margin;

  // ══════════════════════════════════════════════════════════════════════
  // HEADER - Premium dark gradient bar
  // ══════════════════════════════════════════════════════════════════════
  const headerHeight = 18;
  
  // Dark background
  doc.setFillColor(...colors.navy);
  doc.roundedRect(margin, y, contentWidth, headerHeight, 2, 2, 'F');
  
  // Accent gradient bar at bottom
  doc.setFillColor(...colors.electric);
  doc.rect(margin, y + headerHeight - 1.5, contentWidth, 1.5, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFIT ANALYSIS', margin + 8, y + 11);
  
  // Subtitle and date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate400);
  const dateStr = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Option ${dealNumber} • ${productName}`, margin + 8, y + 15);
  doc.text(dateStr, pageWidth - margin - 8, y + 11, { align: 'right' });
  
  y += headerHeight + 6;

  // ══════════════════════════════════════════════════════════════════════
  // KEY METRICS - Three elegant cards
  // ══════════════════════════════════════════════════════════════════════
  const cardGap = 5;
  const cardW = (contentWidth - cardGap * 2) / 3;
  const cardH = 28;
  
  const metricCards = [
    { label: 'REVENUE', value: formatCurrency(metrics.dealSize), accent: colors.electric, textColor: colors.slate700 },
    { label: 'TOTAL COSTS', value: formatCurrency(metrics.totalCosts), accent: colors.coral, textColor: colors.coral },
    { label: 'NET PROFIT', value: formatCurrency(metrics.grossProfit), accent: metrics.grossProfit >= 0 ? colors.emerald : colors.rose, textColor: metrics.grossProfit >= 0 ? colors.emerald : colors.rose },
  ];
  
  metricCards.forEach((card, i) => {
    const x = margin + i * (cardW + cardGap);
    
    // Card background with subtle shadow effect
    doc.setFillColor(...colors.slate100);
    doc.roundedRect(x + 0.3, y + 0.3, cardW, cardH, 2, 2, 'F');
    doc.setFillColor(...colors.white);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
    
    // Top accent bar
    doc.setFillColor(...card.accent);
    doc.roundedRect(x, y, cardW, 2.5, 1, 1, 'F');
    
    // Label
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.slate400);
    doc.text(card.label, x + 6, y + 10);
    
    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...card.textColor);
    doc.text(card.value, x + 6, y + 21);
  });
  
  y += cardH + 6;

  // ══════════════════════════════════════════════════════════════════════
  // PROFIT MARGIN GAUGE - Modern semi-circle gauge
  // ══════════════════════════════════════════════════════════════════════
  const gaugeCardH = 42;
  
  // Card
  doc.setFillColor(...colors.slate100);
  doc.roundedRect(margin + 0.3, y + 0.3, contentWidth, gaugeCardH, 2, 2, 'F');
  doc.setFillColor(...colors.white);
  doc.roundedRect(margin, y, contentWidth, gaugeCardH, 2, 2, 'F');
  
  // Semi-circle gauge
  const gaugeCX = margin + 38;
  const gaugeCY = y + 32;
  const gaugeR = 20;
  const gaugeWidth = 4;
  
  // Background arc (180 degrees)
  doc.setDrawColor(...colors.slate300);
  doc.setLineWidth(gaugeWidth);
  for (let i = 0; i < 60; i++) {
    const angle1 = Math.PI + (i / 60) * Math.PI;
    const angle2 = Math.PI + ((i + 1) / 60) * Math.PI;
    doc.line(
      gaugeCX + gaugeR * Math.cos(angle1), gaugeCY + gaugeR * Math.sin(angle1),
      gaugeCX + gaugeR * Math.cos(angle2), gaugeCY + gaugeR * Math.sin(angle2)
    );
  }
  
  // Progress arc
  const marginPercent = Math.min(100, Math.max(0, metrics.profitMargin * 2));
  const progressColor = metrics.profitMargin >= 20 ? colors.emerald : metrics.profitMargin >= 10 ? colors.amber : colors.rose;
  doc.setDrawColor(...progressColor);
  doc.setLineWidth(gaugeWidth);
  const progressSegments = Math.floor((marginPercent / 100) * 60);
  for (let i = 0; i < progressSegments; i++) {
    const angle1 = Math.PI + (i / 60) * Math.PI;
    const angle2 = Math.PI + ((i + 1) / 60) * Math.PI;
    doc.line(
      gaugeCX + gaugeR * Math.cos(angle1), gaugeCY + gaugeR * Math.sin(angle1),
      gaugeCX + gaugeR * Math.cos(angle2), gaugeCY + gaugeR * Math.sin(angle2)
    );
  }
  
  // Percentage in center
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  doc.text(`${metrics.profitMargin.toFixed(1)}%`, gaugeCX, gaugeCY - 4, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate500);
  doc.text('MARGIN', gaugeCX, gaugeCY + 2, { align: 'center' });
  
  // Right side content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate900);
  doc.text('Profit Margin Analysis', margin + 70, y + 12);
  
  // Status badge
  let statusText = '';
  let statusBg = colors.emerald;
  if (metrics.profitMargin >= 25) { statusText = 'EXCELLENT'; statusBg = colors.emerald; }
  else if (metrics.profitMargin >= 15) { statusText = 'GOOD'; statusBg = colors.electric; }
  else if (metrics.profitMargin >= 5) { statusText = 'MODERATE'; statusBg = colors.amber; }
  else { statusText = 'LOW'; statusBg = colors.rose; }
  
  doc.setFillColor(...statusBg);
  const badgeW = doc.getTextWidth(statusText) * 0.35 + 8;
  doc.roundedRect(margin + 70, y + 16, badgeW, 6, 1.5, 1.5, 'F');
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, margin + 74, y + 20.5);
  
  // Profit summary
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate500);
  doc.text(`${formatCurrency(metrics.dealSize)} revenue − ${formatCurrency(metrics.totalCosts)} costs = `, margin + 70, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  doc.text(formatCurrency(metrics.grossProfit), margin + 70 + doc.getTextWidth(`${formatCurrency(metrics.dealSize)} revenue − ${formatCurrency(metrics.totalCosts)} costs = `), y + 32);
  
  y += gaugeCardH + 5;

  // ══════════════════════════════════════════════════════════════════════
  // COST BREAKDOWN - Two column layout with bars
  // ══════════════════════════════════════════════════════════════════════
  const colGap = 5;
  const colW = (contentWidth - colGap) / 2;
  const colH = 52;
  
  // Fixed Costs Card
  doc.setFillColor(...colors.slate100);
  doc.roundedRect(margin + 0.3, y + 0.3, colW, colH, 2, 2, 'F');
  doc.setFillColor(...colors.white);
  doc.roundedRect(margin, y, colW, colH, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate900);
  doc.text('Fixed Costs', margin + 6, y + 9);
  doc.setFontSize(9);
  doc.setTextColor(...colors.electric);
  doc.text(formatCurrency(metrics.fixedCosts), margin + colW - 6, y + 9, { align: 'right' });
  
  const fixedItems = [
    { label: 'Equipment', value: metrics.equipmentCost, color: colors.electric },
    { label: 'Labor', value: metrics.laborCost, color: colors.teal },
    { label: 'Extras/Materials', value: metrics.extras, color: colors.violet },
  ];
  
  let itemY = y + 16;
  const barMaxW = colW - 50;
  fixedItems.forEach(item => {
    const pct = metrics.fixedCosts > 0 ? (item.value / metrics.fixedCosts) * 100 : 0;
    
    doc.setFillColor(...item.color);
    doc.circle(margin + 8, itemY + 1, 1.5, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slate700);
    doc.text(item.label, margin + 13, itemY + 2.5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.value), margin + colW - 6, itemY + 2.5, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.slate100);
    doc.roundedRect(margin + 6, itemY + 5, barMaxW, 3, 1, 1, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(margin + 6, itemY + 5, Math.max(3, (pct / 100) * barMaxW), 3, 1, 1, 'F');
    }
    
    itemY += 12;
  });
  
  // Variable Costs Card
  const varX = margin + colW + colGap;
  doc.setFillColor(...colors.slate100);
  doc.roundedRect(varX + 0.3, y + 0.3, colW, colH, 2, 2, 'F');
  doc.setFillColor(...colors.white);
  doc.roundedRect(varX, y, colW, colH, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate900);
  doc.text('Variable Costs', varX + 6, y + 9);
  doc.setFontSize(9);
  doc.setTextColor(...colors.coral);
  doc.text(formatCurrency(metrics.variableCosts), varX + colW - 6, y + 9, { align: 'right' });
  
  const varItems = [
    { label: `Dealer Fee (${dealData.dealerFee}%)`, value: metrics.dealerFeeCost, color: colors.coral },
    { label: `Contractor (${dealData.contractorFee}%)`, value: metrics.contractorFeeCost, color: colors.rose },
    { label: `Commission (${dealData.commission}%)`, value: metrics.commissionCost, color: colors.amber },
    { label: `Marketing (${dealData.marketingFee}%)`, value: metrics.marketingFeeCost, color: colors.sky },
  ];
  
  itemY = y + 16;
  varItems.forEach(item => {
    const pct = metrics.variableCosts > 0 ? (item.value / metrics.variableCosts) * 100 : 0;
    
    doc.setFillColor(...item.color);
    doc.circle(varX + 8, itemY + 1, 1.5, 'F');
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slate700);
    doc.text(item.label, varX + 13, itemY + 2.5);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.value), varX + colW - 6, itemY + 2.5, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.slate100);
    doc.roundedRect(varX + 6, itemY + 5, barMaxW, 2.5, 1, 1, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(varX + 6, itemY + 5, Math.max(2.5, (pct / 100) * barMaxW), 2.5, 1, 1, 'F');
    }
    
    itemY += 9;
  });
  
  y += colH + 5;

  // ══════════════════════════════════════════════════════════════════════
  // EXPENSE DISTRIBUTION CHART - Horizontal stacked bar
  // ══════════════════════════════════════════════════════════════════════
  const distH = 28;
  
  doc.setFillColor(...colors.slate100);
  doc.roundedRect(margin + 0.3, y + 0.3, contentWidth, distH, 2, 2, 'F');
  doc.setFillColor(...colors.white);
  doc.roundedRect(margin, y, contentWidth, distH, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slate900);
  doc.text('Cost Distribution', margin + 6, y + 8);
  
  // Stacked bar
  const barY = y + 12;
  const barH = 6;
  const barW = contentWidth - 12;
  
  const allCosts = [
    { value: metrics.equipmentCost, color: colors.electric, label: 'Equipment' },
    { value: metrics.laborCost, color: colors.teal, label: 'Labor' },
    { value: metrics.extras, color: colors.violet, label: 'Extras' },
    { value: metrics.dealerFeeCost, color: colors.coral, label: 'Dealer' },
    { value: metrics.contractorFeeCost, color: colors.rose, label: 'Contractor' },
    { value: metrics.commissionCost, color: colors.amber, label: 'Commission' },
    { value: metrics.marketingFeeCost, color: colors.sky, label: 'Marketing' },
  ];
  
  // Draw stacked bar
  let barX = margin + 6;
  allCosts.forEach((cost, i) => {
    if (cost.value > 0 && metrics.totalCosts > 0) {
      const segW = (cost.value / metrics.totalCosts) * barW;
      doc.setFillColor(...cost.color);
      if (i === 0) {
        doc.roundedRect(barX, barY, segW, barH, barH / 2, barH / 2, 'F');
        if (segW > barH) doc.rect(barX + segW - barH / 2, barY, barH / 2, barH, 'F');
      } else if (i === allCosts.length - 1 || allCosts.slice(i + 1).every(c => c.value === 0)) {
        doc.roundedRect(barX, barY, segW, barH, barH / 2, barH / 2, 'F');
        if (segW > barH) doc.rect(barX, barY, barH / 2, barH, 'F');
      } else {
        doc.rect(barX, barY, segW, barH, 'F');
      }
      barX += segW;
    }
  });
  
  // Legend
  let legendX = margin + 6;
  const legendY2 = y + 23;
  allCosts.forEach((cost) => {
    if (cost.value > 0) {
      doc.setFillColor(...cost.color);
      doc.rect(legendX, legendY2, 4, 3, 'F');
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.slate500);
      const pctStr = `${cost.label} ${((cost.value / metrics.totalCosts) * 100).toFixed(0)}%`;
      doc.text(pctStr, legendX + 5, legendY2 + 2.5);
      legendX += doc.getTextWidth(pctStr) + 9;
    }
  });
  
  y += distH + 5;

  // ══════════════════════════════════════════════════════════════════════
  // FINANCIAL EQUATION - Clean visual
  // ══════════════════════════════════════════════════════════════════════
  const eqH = 18;
  
  doc.setFillColor(...colors.navy);
  doc.roundedRect(margin, y, contentWidth, eqH, 2, 2, 'F');
  
  const eqItems = [
    { value: formatCurrency(metrics.dealSize), label: 'Revenue', color: colors.white },
    { value: '−', label: '', color: colors.slate400, isOp: true },
    { value: formatCurrency(metrics.totalCosts), label: 'Costs', color: colors.coral },
    { value: '=', label: '', color: colors.slate400, isOp: true },
    { value: formatCurrency(metrics.grossProfit), label: 'Profit', color: metrics.grossProfit >= 0 ? colors.emerald : colors.rose },
  ];
  
  const eqW = contentWidth / 5;
  eqItems.forEach((item, i) => {
    const eqX = margin + eqW * i + eqW / 2;
    if (item.isOp) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, eqX, y + 11, { align: 'center' });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, eqX, y + 10, { align: 'center' });
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.slate400);
      doc.text(item.label, eqX, y + 15, { align: 'center' });
    }
  });
  
  y += eqH + 5;

  // ══════════════════════════════════════════════════════════════════════
  // KEY INSIGHT - Contextual callout
  // ══════════════════════════════════════════════════════════════════════
  const insightH = 16;
  
  const insightBg = metrics.profitMargin >= 15 ? [236, 253, 245] : metrics.profitMargin >= 5 ? [255, 251, 235] : [254, 242, 242];
  const insightAccent = metrics.profitMargin >= 15 ? colors.emerald : metrics.profitMargin >= 5 ? colors.amber : colors.rose;
  
  doc.setFillColor(...insightBg);
  doc.roundedRect(margin, y, contentWidth, insightH, 2, 2, 'F');
  
  // Left accent bar
  doc.setFillColor(...insightAccent);
  doc.roundedRect(margin, y, 2, insightH, 1, 1, 'F');
  
  // Icon placeholder (circle)
  doc.setFillColor(...insightAccent);
  doc.circle(margin + 10, y + insightH / 2, 3, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('!', margin + 10, y + insightH / 2 + 1.5, { align: 'center' });
  
  // Insight text
  let insight = '';
  if (metrics.profitMargin >= 25) insight = 'Excellent profitability. This deal structure delivers strong returns and healthy margins.';
  else if (metrics.profitMargin >= 15) insight = 'Good profit margin. Consider optimizing variable costs for even better performance.';
  else if (metrics.profitMargin >= 5) insight = 'Moderate margin. Review commission and dealer fees to improve profitability.';
  else if (metrics.profitMargin >= 0) insight = 'Low margin warning. Cost reduction or price adjustment recommended.';
  else insight = 'Negative margin. This deal results in a loss - restructuring required.';
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate700);
  doc.text(insight, margin + 18, y + insightH / 2 + 2);

  // ══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════
  doc.setDrawColor(...colors.slate300);
  doc.setLineWidth(0.2);
  doc.line(margin, maxY, pageWidth - margin, maxY);
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate400);
  doc.text('Generated by Profit Calculator', margin, maxY + 4);
  doc.text(dateStr, pageWidth - margin, maxY + 4, { align: 'right' });

  // Save the PDF
  const fileName = `profit-analysis-option-${dealNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
