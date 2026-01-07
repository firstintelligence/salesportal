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
  
  const totalCosts = equipmentCost + laborCost + extras + dealerFeeCost + contractorFeeCost + commissionCost + marketingFeeCost;
  const costsBeforeCommission = equipmentCost + laborCost + extras + dealerFeeCost + contractorFeeCost + marketingFeeCost;
  
  const grossProfit = dealSize - totalCosts;
  const profitBeforeCommission = dealSize - costsBeforeCommission;
  const profitMargin = dealSize > 0 ? (grossProfit / dealSize) * 100 : 0;
  const marginBeforeCommission = dealSize > 0 ? (profitBeforeCommission / dealSize) * 100 : 0;

  return {
    dealSize,
    equipmentCost,
    laborCost,
    extras,
    dealerFeeCost,
    contractorFeeCost,
    commissionCost,
    marketingFeeCost,
    totalCosts,
    grossProfit,
    profitMargin,
    marginBeforeCommission,
    profitBeforeCommission,
  };
};

// Draw modern gradient-style header
const drawGradientHeader = (doc, x, y, width, height) => {
  // Create layered effect for depth
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(x, y, width, height, 3, 3, 'F');
  
  // Accent line
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(x, y + height - 2, width, 2, 'F');
};

// Draw modern card
const drawCard = (doc, x, y, width, height, accentColor = null) => {
  // Shadow effect
  doc.setFillColor(226, 232, 240); // slate-200
  doc.roundedRect(x + 0.5, y + 0.5, width, height, 2, 2, 'F');
  
  // Main card
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  
  // Accent line on top
  if (accentColor) {
    doc.setFillColor(...accentColor);
    doc.roundedRect(x, y, width, 2, 1, 1, 'F');
  }
};

// Draw circular progress indicator
const drawCircularProgress = (doc, centerX, centerY, radius, percentage, color, bgColor = [226, 232, 240]) => {
  const segments = 60;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
  
  // Background circle
  doc.setDrawColor(...bgColor);
  doc.setLineWidth(3);
  doc.circle(centerX, centerY, radius, 'S');
  
  // Progress arc
  if (percentage > 0) {
    doc.setDrawColor(...color);
    doc.setLineWidth(3);
    
    for (let i = 0; i < segments; i++) {
      const angle1 = startAngle + (i / segments) * (percentage / 100) * 2 * Math.PI;
      const angle2 = startAngle + ((i + 1) / segments) * (percentage / 100) * 2 * Math.PI;
      
      if (angle1 < endAngle) {
        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(Math.min(angle2, endAngle));
        const y2 = centerY + radius * Math.sin(Math.min(angle2, endAngle));
        
        doc.line(x1, y1, x2, y2);
      }
    }
  }
};

// Draw horizontal bar chart
const drawHorizontalBar = (doc, x, y, maxWidth, height, percentage, color) => {
  // Background
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(x, y, maxWidth, height, height / 2, height / 2, 'F');
  
  // Fill
  const fillWidth = Math.max(height, (percentage / 100) * maxWidth);
  doc.setFillColor(...color);
  doc.roundedRect(x, y, fillWidth, height, height / 2, height / 2, 'F');
};

// Draw stacked bar
const drawStackedBar = (doc, x, y, width, height, segments, colors) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;
  
  let currentX = x;
  segments.forEach((segment, i) => {
    if (segment.value > 0) {
      const segWidth = (segment.value / total) * width;
      doc.setFillColor(...colors[i]);
      
      if (i === 0) {
        // First segment - round left
        doc.roundedRect(currentX, y, segWidth + 2, height, height / 2, height / 2, 'F');
        doc.rect(currentX + segWidth - 2, y, 4, height, 'F');
      } else if (i === segments.length - 1 || segments.slice(i + 1).every(s => s.value === 0)) {
        // Last segment - round right
        doc.rect(currentX, y, 2, height, 'F');
        doc.roundedRect(currentX - 2, y, segWidth + 2, height, height / 2, height / 2, 'F');
      } else {
        doc.rect(currentX, y, segWidth, height, 'F');
      }
      currentX += segWidth;
    }
  });
};

export const generateProfitCalculatorPDF = (dealData, dealNumber, productName = 'Custom Deal') => {
  // 8.5" x 11" in mm = 215.9 x 279.4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 8.5" x 11"
  });

  const metrics = calculateDealMetrics(dealData);
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 12.7; // 0.5 inch = 12.7mm
  const contentWidth = pageWidth - (margin * 2);
  
  // Modern color palette
  const colors = {
    dark: [15, 23, 42],       // slate-900
    primary: [59, 130, 246],  // blue-500
    success: [16, 185, 129],  // emerald-500
    danger: [239, 68, 68],    // red-500
    warning: [245, 158, 11],  // amber-500
    purple: [139, 92, 246],   // violet-500
    pink: [236, 72, 153],     // pink-500
    cyan: [6, 182, 212],      // cyan-500
    slate: [100, 116, 139],   // slate-500
    slateLight: [148, 163, 184], // slate-400
    slateDark: [51, 65, 85],  // slate-700
    bg: [248, 250, 252],      // slate-50
  };

  let yPos = margin;

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  drawGradientHeader(doc, margin, yPos, contentWidth, 22);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFIT ANALYSIS REPORT', margin + 6, yPos + 10);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Option ${dealNumber}  •  ${productName}`, margin + 6, yPos + 17);
  
  // Date on right
  const dateStr = new Date().toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(dateStr, pageWidth - margin - 6, yPos + 10, { align: 'right' });
  
  yPos += 28;

  // ═══════════════════════════════════════════════════════════════
  // KEY METRICS ROW (3 cards)
  // ═══════════════════════════════════════════════════════════════
  const cardWidth = (contentWidth - 8) / 3;
  const cardHeight = 32;
  
  // Revenue Card
  drawCard(doc, margin, yPos, cardWidth, cardHeight, colors.primary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateLight);
  doc.text('TOTAL REVENUE', margin + 6, yPos + 10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text(formatCurrency(metrics.dealSize), margin + 6, yPos + 22);
  
  // Costs Card
  drawCard(doc, margin + cardWidth + 4, yPos, cardWidth, cardHeight, colors.danger);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateLight);
  doc.text('TOTAL COSTS', margin + cardWidth + 10, yPos + 10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text(formatCurrency(metrics.totalCosts), margin + cardWidth + 10, yPos + 22);
  
  // Profit Card
  const profitColor = metrics.grossProfit >= 0 ? colors.success : colors.danger;
  drawCard(doc, margin + (cardWidth + 4) * 2, yPos, cardWidth, cardHeight, profitColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.slateLight);
  doc.text('NET PROFIT', margin + (cardWidth + 4) * 2 + 6, yPos + 10);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...profitColor);
  doc.text(formatCurrency(metrics.grossProfit), margin + (cardWidth + 4) * 2 + 6, yPos + 22);
  
  yPos += cardHeight + 6;

  // ═══════════════════════════════════════════════════════════════
  // PROFIT MARGIN VISUAL (with circular gauge)
  // ═══════════════════════════════════════════════════════════════
  drawCard(doc, margin, yPos, contentWidth, 38);
  
  // Left side - circular gauge
  const gaugeX = margin + 28;
  const gaugeY = yPos + 19;
  const gaugeRadius = 13;
  const marginColor = metrics.profitMargin >= 20 ? colors.success : metrics.profitMargin >= 10 ? colors.warning : colors.danger;
  
  drawCircularProgress(doc, gaugeX, gaugeY, gaugeRadius, Math.min(100, Math.max(0, metrics.profitMargin * 2)), marginColor);
  
  // Percentage in center
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...marginColor);
  doc.text(`${metrics.profitMargin.toFixed(1)}%`, gaugeX, gaugeY + 3, { align: 'center' });
  
  // Right side - labels
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Profit Margin', margin + 52, yPos + 13);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slate);
  doc.text(`Margin before commission: ${metrics.marginBeforeCommission.toFixed(1)}%`, margin + 52, yPos + 21);
  
  // Status badge
  let status = '';
  let statusColor = colors.success;
  if (metrics.profitMargin >= 25) {
    status = 'EXCELLENT';
    statusColor = colors.success;
  } else if (metrics.profitMargin >= 15) {
    status = 'GOOD';
    statusColor = colors.primary;
  } else if (metrics.profitMargin >= 5) {
    status = 'MODERATE';
    statusColor = colors.warning;
  } else {
    status = 'LOW';
    statusColor = colors.danger;
  }
  
  doc.setFillColor(...statusColor);
  const badgeWidth = doc.getTextWidth(status) + 6;
  doc.roundedRect(margin + 52, yPos + 26, badgeWidth + 2, 7, 1.5, 1.5, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(status, margin + 55, yPos + 31);
  
  yPos += 44;

  // ═══════════════════════════════════════════════════════════════
  // COST BREAKDOWN (2 columns)
  // ═══════════════════════════════════════════════════════════════
  const colWidth = (contentWidth - 6) / 2;
  const colHeight = 62;
  
  // Fixed Costs Column
  drawCard(doc, margin, yPos, colWidth, colHeight);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Fixed Costs', margin + 6, yPos + 10);
  
  const fixedTotal = metrics.equipmentCost + metrics.laborCost + metrics.extras;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateLight);
  doc.text(formatCurrency(fixedTotal), margin + colWidth - 6, yPos + 10, { align: 'right' });
  
  const fixedCosts = [
    { label: 'Equipment', value: metrics.equipmentCost, color: colors.primary, percent: fixedTotal > 0 ? (metrics.equipmentCost / fixedTotal) * 100 : 0 },
    { label: 'Labor', value: metrics.laborCost, color: colors.success, percent: fixedTotal > 0 ? (metrics.laborCost / fixedTotal) * 100 : 0 },
    { label: 'Extras/Materials', value: metrics.extras, color: colors.warning, percent: fixedTotal > 0 ? (metrics.extras / fixedTotal) * 100 : 0 },
  ];
  
  let fixedY = yPos + 18;
  fixedCosts.forEach((cost) => {
    // Label and value
    doc.setFillColor(...cost.color);
    doc.circle(margin + 8, fixedY + 1.5, 1.5, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slateDark);
    doc.text(cost.label, margin + 13, fixedY + 3);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(cost.value), margin + colWidth - 6, fixedY + 3, { align: 'right' });
    
    // Mini bar
    drawHorizontalBar(doc, margin + 6, fixedY + 6, colWidth - 12, 2.5, cost.percent, cost.color);
    
    fixedY += 14;
  });
  
  // Variable Costs Column
  drawCard(doc, margin + colWidth + 6, yPos, colWidth, colHeight);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Variable Costs', margin + colWidth + 12, yPos + 10);
  
  const varTotal = metrics.dealerFeeCost + metrics.contractorFeeCost + metrics.commissionCost + metrics.marketingFeeCost;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateLight);
  doc.text(formatCurrency(varTotal), margin + colWidth * 2, yPos + 10, { align: 'right' });
  
  const variableCosts = [
    { label: `Dealer Fee (${dealData.dealerFee}%)`, value: metrics.dealerFeeCost, color: colors.purple, percent: varTotal > 0 ? (metrics.dealerFeeCost / varTotal) * 100 : 0 },
    { label: `Contractor (${dealData.contractorFee}%)`, value: metrics.contractorFeeCost, color: colors.pink, percent: varTotal > 0 ? (metrics.contractorFeeCost / varTotal) * 100 : 0 },
    { label: `Commission (${dealData.commission}%)`, value: metrics.commissionCost, color: colors.cyan, percent: varTotal > 0 ? (metrics.commissionCost / varTotal) * 100 : 0 },
    { label: `Marketing (${dealData.marketingFee}%)`, value: metrics.marketingFeeCost, color: [168, 85, 247], percent: varTotal > 0 ? (metrics.marketingFeeCost / varTotal) * 100 : 0 },
  ];
  
  let varY = yPos + 18;
  variableCosts.forEach((cost) => {
    doc.setFillColor(...cost.color);
    doc.circle(margin + colWidth + 14, varY + 1.5, 1.5, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.slateDark);
    doc.text(cost.label, margin + colWidth + 19, varY + 3);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(cost.value), margin + colWidth * 2, varY + 3, { align: 'right' });
    
    varY += 11;
  });
  
  yPos += colHeight + 6;

  // ═══════════════════════════════════════════════════════════════
  // COST DISTRIBUTION BAR
  // ═══════════════════════════════════════════════════════════════
  drawCard(doc, margin, yPos, contentWidth, 32);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text('Cost Distribution Overview', margin + 6, yPos + 10);
  
  // Stacked bar
  const barSegments = [
    { value: metrics.equipmentCost, label: 'Equipment' },
    { value: metrics.laborCost, label: 'Labor' },
    { value: metrics.extras, label: 'Extras' },
    { value: metrics.dealerFeeCost, label: 'Dealer' },
    { value: metrics.contractorFeeCost, label: 'Contractor' },
    { value: metrics.commissionCost, label: 'Commission' },
    { value: metrics.marketingFeeCost, label: 'Marketing' },
  ];
  
  const barColors = [
    colors.primary,
    colors.success,
    colors.warning,
    colors.purple,
    colors.pink,
    colors.cyan,
    [168, 85, 247],
  ];
  
  drawStackedBar(doc, margin + 6, yPos + 15, contentWidth - 12, 6, barSegments, barColors);
  
  // Legend row
  let legendX = margin + 6;
  const legendY = yPos + 25;
  barSegments.forEach((seg, i) => {
    if (seg.value > 0) {
      doc.setFillColor(...barColors[i]);
      doc.rect(legendX, legendY, 4, 4, 'F');
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.slate);
      doc.text(seg.label, legendX + 5, legendY + 3);
      legendX += doc.getTextWidth(seg.label) + 10;
    }
  });
  
  yPos += 38;

  // ═══════════════════════════════════════════════════════════════
  // FINANCIAL SUMMARY ROW
  // ═══════════════════════════════════════════════════════════════
  const summaryCardWidth = (contentWidth - 8) / 3;
  const summaryHeight = 26;
  
  // Revenue breakdown
  drawCard(doc, margin, yPos, summaryCardWidth, summaryHeight);
  doc.setFontSize(6);
  doc.setTextColor(...colors.slateLight);
  doc.text('Revenue', margin + 6, yPos + 8);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text(formatCurrency(metrics.dealSize), margin + 6, yPos + 18);
  
  // Costs breakdown
  drawCard(doc, margin + summaryCardWidth + 4, yPos, summaryCardWidth, summaryHeight);
  doc.setFontSize(6);
  doc.setTextColor(...colors.slateLight);
  doc.text('− Total Costs', margin + summaryCardWidth + 10, yPos + 8);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.danger);
  doc.text(formatCurrency(metrics.totalCosts), margin + summaryCardWidth + 10, yPos + 18);
  
  // Net result
  drawCard(doc, margin + (summaryCardWidth + 4) * 2, yPos, summaryCardWidth, summaryHeight, profitColor);
  doc.setFontSize(6);
  doc.setTextColor(...colors.slateLight);
  doc.text('= Net Profit', margin + (summaryCardWidth + 4) * 2 + 6, yPos + 8);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...profitColor);
  doc.text(formatCurrency(metrics.grossProfit), margin + (summaryCardWidth + 4) * 2 + 6, yPos + 18);
  
  yPos += summaryHeight + 6;

  // ═══════════════════════════════════════════════════════════════
  // INSIGHTS SECTION
  // ═══════════════════════════════════════════════════════════════
  const insightBg = metrics.profitMargin >= 15 ? [240, 253, 250] : metrics.profitMargin >= 5 ? [255, 251, 235] : [254, 242, 242];
  const insightAccent = metrics.profitMargin >= 15 ? colors.success : metrics.profitMargin >= 5 ? colors.warning : colors.danger;
  
  doc.setFillColor(...insightBg);
  doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'F');
  
  // Accent bar
  doc.setFillColor(...insightAccent);
  doc.roundedRect(margin, yPos, 3, 22, 1, 1, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...insightAccent);
  doc.text('KEY INSIGHT', margin + 8, yPos + 8);
  
  let insight = '';
  if (metrics.profitMargin >= 25) {
    insight = 'Excellent profit margin! This deal structure is highly profitable with strong returns.';
  } else if (metrics.profitMargin >= 15) {
    insight = 'Good profit margin. Consider optimizing variable costs for even better returns.';
  } else if (metrics.profitMargin >= 5) {
    insight = 'Moderate margin. Review commission and dealer fees to improve profitability.';
  } else if (metrics.profitMargin >= 0) {
    insight = 'Low margin warning. Significant cost reduction or price increase is recommended.';
  } else {
    insight = 'Negative margin - this deal results in a loss. Restructuring is required immediately.';
  }
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateDark);
  doc.text(insight, margin + 8, yPos + 16);
  
  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.slateLight);
  doc.text('Generated by Profit Calculator', pageWidth / 2, pageHeight - margin, { align: 'center' });
  
  // Decorative line
  doc.setDrawColor(...colors.slateLight);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);

  // Save the PDF
  const fileName = `profit-analysis-option-${dealNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
