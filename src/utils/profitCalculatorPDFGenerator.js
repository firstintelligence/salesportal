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

// Draw a rounded rectangle
const drawRoundedRect = (doc, x, y, width, height, radius, fillColor, strokeColor = null) => {
  doc.setFillColor(...fillColor);
  if (strokeColor) {
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.5);
  }
  doc.roundedRect(x, y, width, height, radius, radius, strokeColor ? 'FD' : 'F');
};

// Draw a progress bar
const drawProgressBar = (doc, x, y, width, height, percentage, bgColor, fillColor) => {
  // Background
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  
  // Fill
  const fillWidth = Math.max(0, Math.min(100, percentage)) / 100 * width;
  if (fillWidth > 0) {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, y, fillWidth, height, height / 2, height / 2, 'F');
  }
};

// Draw pie chart
const drawPieChart = (doc, centerX, centerY, radius, data, colors) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return;
  
  let startAngle = -Math.PI / 2; // Start from top
  
  data.forEach((item, index) => {
    if (item.value <= 0) return;
    
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Draw slice
    doc.setFillColor(...colors[index % colors.length]);
    
    // Create pie slice path
    const segments = 50;
    const points = [];
    points.push([centerX, centerY]);
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (sliceAngle * i / segments);
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    // Draw filled polygon
    doc.setFillColor(...colors[index % colors.length]);
    const xPoints = points.map(p => p[0]);
    const yPoints = points.map(p => p[1]);
    
    // Use triangle fan approach for pie
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(
        points[0][0], points[0][1],
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        'F'
      );
    }
    
    startAngle = endAngle;
  });
};

// Draw donut chart (simpler approach with circles)
const drawDonutChart = (doc, centerX, centerY, outerRadius, innerRadius, data, colors) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    // Draw empty state
    doc.setFillColor(229, 231, 235);
    doc.circle(centerX, centerY, outerRadius, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, innerRadius, 'F');
    return;
  }
  
  // Draw full outer circle first, then overlay segments
  let startAngle = -Math.PI / 2;
  
  data.forEach((item, index) => {
    if (item.value <= 0) return;
    
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    doc.setFillColor(...colors[index % colors.length]);
    
    // Draw arc segments using many small triangles
    const segments = Math.max(10, Math.floor(sliceAngle * 30));
    for (let i = 0; i < segments; i++) {
      const angle1 = startAngle + (sliceAngle * i / segments);
      const angle2 = startAngle + (sliceAngle * (i + 1) / segments);
      
      doc.triangle(
        centerX, centerY,
        centerX + outerRadius * Math.cos(angle1), centerY + outerRadius * Math.sin(angle1),
        centerX + outerRadius * Math.cos(angle2), centerY + outerRadius * Math.sin(angle2),
        'F'
      );
    }
    
    startAngle += sliceAngle;
  });
  
  // Draw inner circle to create donut hole
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius, 'F');
};

export const generateProfitCalculatorPDF = (dealData, dealNumber, productName = 'Custom Deal') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const metrics = calculateDealMetrics(dealData);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryColor = [25, 69, 120]; // #194578
  const accentColor = [59, 130, 246]; // Blue
  const greenColor = [34, 197, 94]; // Green
  const redColor = [239, 68, 68]; // Red
  const orangeColor = [249, 115, 22]; // Orange
  const purpleColor = [139, 92, 246]; // Purple
  const grayColor = [107, 114, 128];
  const lightGray = [243, 244, 246];
  const darkGray = [31, 41, 55];

  let yPos = margin;

  // Header with gradient-style background
  drawRoundedRect(doc, margin, yPos, contentWidth, 35, 4, primaryColor);
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFIT ANALYSIS', margin + 10, yPos + 15);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Option ${dealNumber} - ${productName}`, margin + 10, yPos + 25);
  
  // Date badge
  const dateStr = new Date().toLocaleDateString('en-CA', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.setFontSize(10);
  doc.text(dateStr, pageWidth - margin - 10 - doc.getTextWidth(dateStr), yPos + 15);
  
  yPos += 45;

  // Key Metrics Row - Big numbers
  const metricBoxWidth = (contentWidth - 10) / 3;
  
  // Revenue Box
  drawRoundedRect(doc, margin, yPos, metricBoxWidth, 40, 4, [239, 246, 255], accentColor);
  doc.setTextColor(...accentColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REVENUE', margin + metricBoxWidth / 2, yPos + 10, { align: 'center' });
  doc.setFontSize(22);
  doc.setTextColor(...darkGray);
  doc.text(formatCurrency(metrics.dealSize), margin + metricBoxWidth / 2, yPos + 28, { align: 'center' });
  
  // Total Costs Box
  drawRoundedRect(doc, margin + metricBoxWidth + 5, yPos, metricBoxWidth, 40, 4, [254, 242, 242], redColor);
  doc.setTextColor(...redColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COSTS', margin + metricBoxWidth + 5 + metricBoxWidth / 2, yPos + 10, { align: 'center' });
  doc.setFontSize(22);
  doc.setTextColor(...darkGray);
  doc.text(formatCurrency(metrics.totalCosts), margin + metricBoxWidth + 5 + metricBoxWidth / 2, yPos + 28, { align: 'center' });
  
  // Profit Box
  const profitBgColor = metrics.grossProfit >= 0 ? [240, 253, 244] : [254, 242, 242];
  const profitAccentColor = metrics.grossProfit >= 0 ? greenColor : redColor;
  drawRoundedRect(doc, margin + (metricBoxWidth + 5) * 2, yPos, metricBoxWidth, 40, 4, profitBgColor, profitAccentColor);
  doc.setTextColor(...profitAccentColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET PROFIT', margin + (metricBoxWidth + 5) * 2 + metricBoxWidth / 2, yPos + 10, { align: 'center' });
  doc.setFontSize(22);
  doc.text(formatCurrency(metrics.grossProfit), margin + (metricBoxWidth + 5) * 2 + metricBoxWidth / 2, yPos + 28, { align: 'center' });
  
  yPos += 50;

  // Profit Margin Visual
  drawRoundedRect(doc, margin, yPos, contentWidth, 30, 4, lightGray);
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Profit Margin', margin + 10, yPos + 12);
  
  // Large margin percentage
  const marginColor = metrics.profitMargin >= 20 ? greenColor : metrics.profitMargin >= 10 ? orangeColor : redColor;
  doc.setTextColor(...marginColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${metrics.profitMargin.toFixed(1)}%`, pageWidth - margin - 50, yPos + 18);
  
  // Progress bar for margin
  const barY = yPos + 22;
  drawProgressBar(doc, margin + 10, barY, contentWidth - 80, 4, Math.min(50, metrics.profitMargin) * 2, [209, 213, 219], marginColor);
  
  yPos += 40;

  // Cost Breakdown Section with Donut Chart
  const sectionWidth = (contentWidth - 10) / 2;
  
  // Left: Fixed Costs
  drawRoundedRect(doc, margin, yPos, sectionWidth, 70, 4, [255, 255, 255], [209, 213, 219]);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Fixed Costs', margin + 8, yPos + 12);
  
  const fixedCosts = [
    { label: 'Equipment', value: metrics.equipmentCost, color: accentColor },
    { label: 'Labor', value: metrics.laborCost, color: greenColor },
    { label: 'Extras', value: metrics.extras, color: orangeColor },
  ];
  
  let fixedY = yPos + 22;
  fixedCosts.forEach((cost, i) => {
    // Color dot
    doc.setFillColor(...cost.color);
    doc.circle(margin + 12, fixedY + 2, 2, 'F');
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(cost.label, margin + 18, fixedY + 4);
    
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(cost.value), margin + sectionWidth - 10, fixedY + 4, { align: 'right' });
    
    fixedY += 14;
  });
  
  // Fixed costs total
  doc.setDrawColor(209, 213, 219);
  doc.line(margin + 10, fixedY, margin + sectionWidth - 10, fixedY);
  fixedY += 6;
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Subtotal', margin + 12, fixedY + 2);
  doc.text(formatCurrency(metrics.equipmentCost + metrics.laborCost + metrics.extras), margin + sectionWidth - 10, fixedY + 2, { align: 'right' });
  
  // Right: Variable Costs
  drawRoundedRect(doc, margin + sectionWidth + 10, yPos, sectionWidth, 70, 4, [255, 255, 255], [209, 213, 219]);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Variable Costs', margin + sectionWidth + 18, yPos + 12);
  
  const variableCosts = [
    { label: `Dealer Fee (${dealData.dealerFee}%)`, value: metrics.dealerFeeCost, color: purpleColor },
    { label: `Contractor (${dealData.contractorFee}%)`, value: metrics.contractorFeeCost, color: [236, 72, 153] },
    { label: `Commission (${dealData.commission}%)`, value: metrics.commissionCost, color: [14, 165, 233] },
    { label: `Marketing (${dealData.marketingFee}%)`, value: metrics.marketingFeeCost, color: [168, 85, 247] },
  ];
  
  let varY = yPos + 22;
  variableCosts.forEach((cost, i) => {
    doc.setFillColor(...cost.color);
    doc.circle(margin + sectionWidth + 22, varY + 2, 2, 'F');
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(cost.label, margin + sectionWidth + 28, varY + 4);
    
    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(cost.value), margin + sectionWidth * 2, varY + 4, { align: 'right' });
    
    varY += 12;
  });
  
  yPos += 80;

  // Cost Distribution Donut Chart
  drawRoundedRect(doc, margin, yPos, contentWidth, 75, 4, [255, 255, 255], [209, 213, 219]);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Distribution', margin + 10, yPos + 12);
  
  // Draw donut chart
  const chartData = [
    { label: 'Equipment', value: metrics.equipmentCost },
    { label: 'Labor', value: metrics.laborCost },
    { label: 'Extras', value: metrics.extras },
    { label: 'Dealer Fee', value: metrics.dealerFeeCost },
    { label: 'Contractor', value: metrics.contractorFeeCost },
    { label: 'Commission', value: metrics.commissionCost },
    { label: 'Marketing', value: metrics.marketingFeeCost },
  ];
  
  const chartColors = [
    accentColor,
    greenColor,
    orangeColor,
    purpleColor,
    [236, 72, 153],
    [14, 165, 233],
    [168, 85, 247],
  ];
  
  const chartCenterX = margin + 50;
  const chartCenterY = yPos + 45;
  drawDonutChart(doc, chartCenterX, chartCenterY, 25, 12, chartData, chartColors);
  
  // Center text in donut
  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', chartCenterX, chartCenterY - 2, { align: 'center' });
  doc.setFontSize(10);
  doc.text(formatCurrency(metrics.totalCosts), chartCenterX, chartCenterY + 5, { align: 'center' });
  
  // Legend
  let legendX = margin + 90;
  let legendY = yPos + 20;
  const legendItemsPerRow = 2;
  const legendColWidth = (contentWidth - 80) / legendItemsPerRow;
  
  chartData.forEach((item, i) => {
    if (item.value > 0) {
      const col = i % legendItemsPerRow;
      const row = Math.floor(i / legendItemsPerRow);
      const x = legendX + (col * legendColWidth);
      const y = legendY + (row * 12);
      
      doc.setFillColor(...chartColors[i]);
      doc.circle(x, y + 2, 2, 'F');
      
      doc.setTextColor(...grayColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, x + 5, y + 4);
      
      doc.setTextColor(...darkGray);
      doc.setFont('helvetica', 'bold');
      const percentage = metrics.totalCosts > 0 ? ((item.value / metrics.totalCosts) * 100).toFixed(0) : 0;
      doc.text(`${percentage}%`, x + legendColWidth - 15, y + 4, { align: 'right' });
    }
  });
  
  yPos += 85;

  // Profitability Summary
  drawRoundedRect(doc, margin, yPos, contentWidth, 50, 4, metrics.grossProfit >= 0 ? [240, 253, 244] : [254, 242, 242]);
  
  const summaryColor = metrics.grossProfit >= 0 ? greenColor : redColor;
  doc.setTextColor(...summaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Profitability Summary', margin + 10, yPos + 14);
  
  // Summary metrics in a row
  const summaryMetrics = [
    { label: 'Profit Margin', value: `${metrics.profitMargin.toFixed(1)}%` },
    { label: 'Margin (before comm.)', value: `${metrics.marginBeforeCommission.toFixed(1)}%` },
    { label: 'Net Profit', value: formatCurrency(metrics.grossProfit) },
  ];
  
  const summaryItemWidth = (contentWidth - 20) / 3;
  summaryMetrics.forEach((metric, i) => {
    const x = margin + 10 + (i * summaryItemWidth);
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x, yPos + 28);
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x, yPos + 40);
  });
  
  yPos += 60;

  // Insights Box
  drawRoundedRect(doc, margin, yPos, contentWidth, 35, 4, [254, 249, 195]);
  
  doc.setTextColor(161, 98, 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('💡 Key Insights', margin + 10, yPos + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let insight = '';
  if (metrics.profitMargin >= 25) {
    insight = 'Excellent profit margin! This deal structure is highly profitable.';
  } else if (metrics.profitMargin >= 15) {
    insight = 'Good profit margin. Consider optimizing costs for even better returns.';
  } else if (metrics.profitMargin >= 5) {
    insight = 'Moderate margin. Review variable costs to improve profitability.';
  } else if (metrics.profitMargin >= 0) {
    insight = 'Low margin. Significant cost reduction or price increase recommended.';
  } else {
    insight = 'Negative margin - this deal will result in a loss. Restructure required.';
  }
  
  doc.text(insight, margin + 10, yPos + 24);
  
  // Footer
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by Profit Calculator', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `profit-analysis-option-${dealNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
