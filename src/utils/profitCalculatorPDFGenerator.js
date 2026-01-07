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
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);
  
  // Modern, clean color palette - light theme with soft accents
  const colors = {
    // Background & surfaces
    pageBg: [250, 251, 252],
    cardBg: [255, 255, 255],
    cardBorder: [234, 236, 240],
    
    // Text hierarchy
    textPrimary: [17, 24, 39],
    textSecondary: [75, 85, 99],
    textMuted: [156, 163, 175],
    
    // Accent colors - soft, modern palette
    blue: [59, 130, 246],
    blueSoft: [239, 246, 255],
    green: [34, 197, 94],
    greenSoft: [240, 253, 244],
    red: [239, 68, 68],
    redSoft: [254, 242, 242],
    amber: [245, 158, 11],
    amberSoft: [255, 251, 235],
    purple: [139, 92, 246],
    purpleSoft: [245, 243, 255],
    teal: [20, 184, 166],
    cyan: [6, 182, 212],
    pink: [236, 72, 153],
    indigo: [99, 102, 241],
  };

  // Fill page background
  doc.setFillColor(...colors.pageBg);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let y = margin;
  const dateStr = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // ══════════════════════════════════════════════════════════════════════
  // HEADER - Clean, minimal header
  // ══════════════════════════════════════════════════════════════════════
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Profit Analysis', margin, y + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text(dateStr, pageWidth - margin, y + 6, { align: 'right' });
  
  // Product name badge
  y += 14;
  doc.setFillColor(...colors.blueSoft);
  const badgeText = `${productName}`;
  const badgeWidth = doc.getTextWidth(badgeText) * 0.35 + 12;
  doc.roundedRect(margin, y, badgeWidth, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.blue);
  doc.text(badgeText, margin + 6, y + 5);
  
  y += 16;

  // ══════════════════════════════════════════════════════════════════════
  // KEY METRICS - Three clean metric cards
  // ══════════════════════════════════════════════════════════════════════
  const cardGap = 6;
  const cardW = (contentWidth - cardGap * 2) / 3;
  const cardH = 32;
  
  const metricCards = [
    { 
      label: 'Revenue', 
      value: formatCurrency(metrics.dealSize), 
      iconBg: colors.blueSoft,
      iconColor: colors.blue,
      valueColor: colors.textPrimary
    },
    { 
      label: 'Total Costs', 
      value: formatCurrency(metrics.totalCosts), 
      iconBg: colors.amberSoft,
      iconColor: colors.amber,
      valueColor: colors.amber
    },
    { 
      label: 'Net Profit', 
      value: formatCurrency(metrics.grossProfit), 
      iconBg: metrics.grossProfit >= 0 ? colors.greenSoft : colors.redSoft,
      iconColor: metrics.grossProfit >= 0 ? colors.green : colors.red,
      valueColor: metrics.grossProfit >= 0 ? colors.green : colors.red
    },
  ];
  
  metricCards.forEach((card, i) => {
    const x = margin + i * (cardW + cardGap);
    
    // Card with subtle border
    doc.setFillColor(...colors.cardBg);
    doc.setDrawColor(...colors.cardBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');
    
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textSecondary);
    doc.text(card.label, x + 10, y + 12);
    
    // Value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...card.valueColor);
    doc.text(card.value, x + 10, y + 24);
  });
  
  y += cardH + 10;

  // ══════════════════════════════════════════════════════════════════════
  // PROFIT MARGIN SECTION - Clean gauge with analysis
  // ══════════════════════════════════════════════════════════════════════
  const gaugeCardH = 50;
  
  // Card
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, y, contentWidth, gaugeCardH, 3, 3, 'FD');
  
  // Left side - Circular progress indicator
  const gaugeCX = margin + 35;
  const gaugeCY = y + gaugeCardH / 2;
  const gaugeR = 18;
  
  // Background circle
  doc.setDrawColor(...colors.cardBorder);
  doc.setLineWidth(3);
  doc.circle(gaugeCX, gaugeCY, gaugeR, 'S');
  
  // Progress arc (simplified - draw as colored circle segment)
  const progressColor = metrics.profitMargin >= 20 ? colors.green : 
                        metrics.profitMargin >= 10 ? colors.amber : 
                        metrics.profitMargin >= 0 ? colors.amber : colors.red;
  doc.setDrawColor(...progressColor);
  doc.setLineWidth(3);
  
  // Draw progress arc segments
  const absMargin = Math.abs(metrics.profitMargin);
  const progressPct = Math.min(100, absMargin * 2);
  const segments = Math.floor(progressPct / 100 * 36);
  for (let i = 0; i < segments; i++) {
    const startAngle = -90 + (i * 10);
    const endAngle = -90 + ((i + 1) * 10);
    const rad1 = (startAngle * Math.PI) / 180;
    const rad2 = (endAngle * Math.PI) / 180;
    doc.line(
      gaugeCX + gaugeR * Math.cos(rad1), 
      gaugeCY + gaugeR * Math.sin(rad1),
      gaugeCX + gaugeR * Math.cos(rad2), 
      gaugeCY + gaugeR * Math.sin(rad2)
    );
  }
  
  // Center text
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  const marginText = `${metrics.profitMargin >= 0 ? '' : ''}${metrics.profitMargin.toFixed(1)}%`;
  doc.text(marginText, gaugeCX, gaugeCY + 2, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text('Margin', gaugeCX, gaugeCY + 8, { align: 'center' });
  
  // Right side - Analysis text
  const rightX = margin + 70;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Profit Margin Analysis', rightX, y + 14);
  
  // Status badge
  let statusText = '';
  let statusBg = colors.greenSoft;
  let statusColor = colors.green;
  if (metrics.profitMargin >= 25) { 
    statusText = 'Excellent'; statusBg = colors.greenSoft; statusColor = colors.green;
  } else if (metrics.profitMargin >= 15) { 
    statusText = 'Good'; statusBg = colors.blueSoft; statusColor = colors.blue;
  } else if (metrics.profitMargin >= 5) { 
    statusText = 'Moderate'; statusBg = colors.amberSoft; statusColor = colors.amber;
  } else if (metrics.profitMargin >= 0) { 
    statusText = 'Low'; statusBg = colors.amberSoft; statusColor = colors.amber;
  } else { 
    statusText = 'Loss'; statusBg = colors.redSoft; statusColor = colors.red;
  }
  
  doc.setFillColor(...statusBg);
  const statusW = doc.getTextWidth(statusText) * 0.35 + 8;
  doc.roundedRect(rightX, y + 18, statusW, 6, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...statusColor);
  doc.text(statusText, rightX + 4, y + 22.5);
  
  // Summary line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(`Revenue: ${formatCurrency(metrics.dealSize)}`, rightX, y + 34);
  doc.text(`Costs: ${formatCurrency(metrics.totalCosts)}`, rightX + 55, y + 34);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...progressColor);
  doc.text(`Profit: ${formatCurrency(metrics.grossProfit)}`, rightX, y + 42);
  
  y += gaugeCardH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // COST BREAKDOWN - Two column cards
  // ══════════════════════════════════════════════════════════════════════
  const colGap = 8;
  const colW = (contentWidth - colGap) / 2;
  const colH = 58;
  
  // Fixed Costs Card
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, y, colW, colH, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Fixed Costs', margin + 10, y + 12);
  
  doc.setTextColor(...colors.blue);
  doc.text(formatCurrency(metrics.fixedCosts), margin + colW - 10, y + 12, { align: 'right' });
  
  const fixedItems = [
    { label: 'Equipment', value: metrics.equipmentCost, color: colors.blue },
    { label: 'Labor', value: metrics.laborCost, color: colors.teal },
    { label: 'Extras/Materials', value: metrics.extras, color: colors.purple },
  ];
  
  let itemY = y + 22;
  const barMaxW = colW - 65;
  
  fixedItems.forEach(item => {
    const pct = metrics.fixedCosts > 0 ? (item.value / metrics.fixedCosts) * 100 : 0;
    
    // Dot indicator
    doc.setFillColor(...item.color);
    doc.circle(margin + 14, itemY, 2, 'F');
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textSecondary);
    doc.text(item.label, margin + 20, itemY + 1.5);
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textPrimary);
    doc.text(formatCurrency(item.value), margin + colW - 10, itemY + 1.5, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.pageBg);
    doc.roundedRect(margin + 10, itemY + 5, barMaxW, 3, 1.5, 1.5, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(margin + 10, itemY + 5, Math.max(3, (pct / 100) * barMaxW), 3, 1.5, 1.5, 'F');
    }
    
    itemY += 14;
  });
  
  // Variable Costs Card
  const varX = margin + colW + colGap;
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(varX, y, colW, colH, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Variable Costs', varX + 10, y + 12);
  
  doc.setTextColor(...colors.amber);
  doc.text(formatCurrency(metrics.variableCosts), varX + colW - 10, y + 12, { align: 'right' });
  
  const varItems = [
    { label: `Dealer Fee (${dealData.dealerFee}%)`, value: metrics.dealerFeeCost, color: colors.amber },
    { label: `Contractor (${dealData.contractorFee}%)`, value: metrics.contractorFeeCost, color: colors.pink },
    { label: `Commission (${dealData.commission}%)`, value: metrics.commissionCost, color: colors.indigo },
    { label: `Marketing (${dealData.marketingFee}%)`, value: metrics.marketingFeeCost, color: colors.cyan },
  ];
  
  itemY = y + 22;
  varItems.forEach(item => {
    const pct = metrics.variableCosts > 0 ? (item.value / metrics.variableCosts) * 100 : 0;
    
    doc.setFillColor(...item.color);
    doc.circle(varX + 14, itemY, 2, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textSecondary);
    doc.text(item.label, varX + 20, itemY + 1.5);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textPrimary);
    doc.text(formatCurrency(item.value), varX + colW - 10, itemY + 1.5, { align: 'right' });
    
    // Progress bar
    doc.setFillColor(...colors.pageBg);
    doc.roundedRect(varX + 10, itemY + 5, barMaxW, 2.5, 1, 1, 'F');
    if (pct > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(varX + 10, itemY + 5, Math.max(2.5, (pct / 100) * barMaxW), 2.5, 1, 1, 'F');
    }
    
    itemY += 10;
  });
  
  y += colH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // COST DISTRIBUTION - Clean horizontal bar chart
  // ══════════════════════════════════════════════════════════════════════
  const distH = 38;
  
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.cardBorder);
  doc.roundedRect(margin, y, contentWidth, distH, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Cost Distribution', margin + 10, y + 11);
  
  // Stacked bar
  const barY = y + 16;
  const barH = 8;
  const barW = contentWidth - 20;
  
  const allCosts = [
    { value: metrics.equipmentCost, color: colors.blue, label: 'Equipment' },
    { value: metrics.laborCost, color: colors.teal, label: 'Labor' },
    { value: metrics.extras, color: colors.purple, label: 'Extras' },
    { value: metrics.dealerFeeCost, color: colors.amber, label: 'Dealer' },
    { value: metrics.contractorFeeCost, color: colors.pink, label: 'Contractor' },
    { value: metrics.commissionCost, color: colors.indigo, label: 'Commission' },
    { value: metrics.marketingFeeCost, color: colors.cyan, label: 'Marketing' },
  ];
  
  // Background bar
  doc.setFillColor(...colors.pageBg);
  doc.roundedRect(margin + 10, barY, barW, barH, 4, 4, 'F');
  
  // Draw stacked segments
  let barX = margin + 10;
  const activeCosts = allCosts.filter(c => c.value > 0);
  activeCosts.forEach((cost, i) => {
    if (metrics.totalCosts > 0) {
      const segW = (cost.value / metrics.totalCosts) * barW;
      doc.setFillColor(...cost.color);
      
      // First segment - rounded left
      if (i === 0) {
        doc.roundedRect(barX, barY, segW + 2, barH, 4, 4, 'F');
        doc.rect(barX + segW - 2, barY, 4, barH, 'F');
      } 
      // Last segment - rounded right
      else if (i === activeCosts.length - 1) {
        doc.roundedRect(barX - 2, barY, segW + 2, barH, 4, 4, 'F');
        doc.rect(barX - 2, barY, 4, barH, 'F');
      } 
      // Middle segments
      else {
        doc.rect(barX, barY, segW, barH, 'F');
      }
      barX += segW;
    }
  });
  
  // Legend
  let legendX = margin + 10;
  const legendY = y + 30;
  activeCosts.forEach((cost) => {
    doc.setFillColor(...cost.color);
    doc.roundedRect(legendX, legendY, 6, 4, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textSecondary);
    const pctStr = `${cost.label} ${((cost.value / metrics.totalCosts) * 100).toFixed(0)}%`;
    doc.text(pctStr, legendX + 8, legendY + 3);
    legendX += doc.getTextWidth(pctStr) + 14;
  });
  
  y += distH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // SUMMARY CARD - Clean equation display
  // ══════════════════════════════════════════════════════════════════════
  const summaryH = 24;
  
  doc.setFillColor(...colors.blueSoft);
  doc.roundedRect(margin, y, contentWidth, summaryH, 3, 3, 'F');
  
  const summaryItems = [
    { value: formatCurrency(metrics.dealSize), label: 'Revenue', color: colors.textPrimary },
    { value: '−', isOp: true },
    { value: formatCurrency(metrics.totalCosts), label: 'Costs', color: colors.amber },
    { value: '=', isOp: true },
    { value: formatCurrency(metrics.grossProfit), label: 'Profit', color: metrics.grossProfit >= 0 ? colors.green : colors.red },
  ];
  
  const itemW = contentWidth / 5;
  summaryItems.forEach((item, i) => {
    const itemX = margin + itemW * i + itemW / 2;
    
    if (item.isOp) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(item.value, itemX, y + 14, { align: 'center' });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...item.color);
      doc.text(item.value, itemX, y + 12, { align: 'center' });
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(item.label, itemX, y + 18, { align: 'center' });
    }
  });
  
  y += summaryH + 8;

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHT CALLOUT
  // ══════════════════════════════════════════════════════════════════════
  const insightH = 20;
  
  let insightBg, insightBorder, insightIcon;
  if (metrics.profitMargin >= 15) {
    insightBg = colors.greenSoft;
    insightBorder = colors.green;
    insightIcon = '✓';
  } else if (metrics.profitMargin >= 5) {
    insightBg = colors.amberSoft;
    insightBorder = colors.amber;
    insightIcon = '!';
  } else {
    insightBg = colors.redSoft;
    insightBorder = colors.red;
    insightIcon = '!';
  }
  
  doc.setFillColor(...insightBg);
  doc.roundedRect(margin, y, contentWidth, insightH, 3, 3, 'F');
  
  // Left accent bar
  doc.setFillColor(...insightBorder);
  doc.roundedRect(margin, y, 3, insightH, 2, 2, 'F');
  
  // Icon
  doc.setFillColor(...insightBorder);
  doc.circle(margin + 14, y + insightH / 2, 4, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(insightIcon, margin + 14, y + insightH / 2 + 2, { align: 'center' });
  
  // Insight text
  let insight = '';
  if (metrics.profitMargin >= 25) {
    insight = 'Excellent profitability. This deal delivers strong returns with healthy margins.';
  } else if (metrics.profitMargin >= 15) {
    insight = 'Good profit margin. Consider optimizing variable costs for even better results.';
  } else if (metrics.profitMargin >= 5) {
    insight = 'Moderate margin. Review fees and costs to improve profitability.';
  } else if (metrics.profitMargin >= 0) {
    insight = 'Low margin warning. Cost reduction or price adjustment recommended.';
  } else {
    insight = 'Negative margin. This deal results in a loss — restructuring required.';
  }
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(insight, margin + 24, y + insightH / 2 + 2);

  // ══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════
  const footerY = pageHeight - margin - 4;
  
  doc.setDrawColor(...colors.cardBorder);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text('Generated by Profit Calculator', margin, footerY);
  doc.text(dateStr, pageWidth - margin, footerY, { align: 'right' });

  // Save the PDF
  const fileName = `profit-analysis-${productName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
