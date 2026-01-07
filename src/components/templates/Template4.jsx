import React from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import BaseTemplate from './BaseTemplate';
import { formatPhoneNumber } from '../../utils/inputFormatting';
import { getProductDescription } from '../../utils/productDescriptions';

// Consistent signature dimensions across all pages - increased size 2-3x
const SIGNATURE_STYLE = {
  maxHeight: '120px',
  height: 'auto',
  width: 'auto',
  maxWidth: '350px',
  objectFit: 'contain'
};

const Template4 = ({ data, showTermsAndConditions = true }) => {
  const { 
    billTo = {}, 
    shipTo = {}, 
    invoice = {}, 
    yourCompany = {}, 
    items = [], 
    taxPercentage = 0, 
    taxAmount = 0, 
    subTotal = 0, 
    grandTotal = 0, 
    financing = {},
    rebatesIncentives = {},
    notes = '', 
    isInvoice = false,
    signature = null,
    coApplicantSignature = null,
    signingLocation = null,
  } = data || {};

  // Format signing location in Canadian format: Address, City, Province (2 letters) XXX XXX
  const formatSigningLocation = () => {
    if (!signingLocation) return null;
    const parts = [];
    if (signingLocation.city) parts.push(signingLocation.city);
    if (signingLocation.region) {
      // Get province abbreviation (first 2 letters or full if already short)
      const province = signingLocation.region.length <= 2 
        ? signingLocation.region.toUpperCase() 
        : signingLocation.region.substring(0, 2).toUpperCase();
      parts.push(province);
    }
    if (signingLocation.postal_code) {
      // Format postal code: XXX XXX
      const pc = signingLocation.postal_code.replace(/\s/g, '').toUpperCase();
      const formattedPC = pc.length === 6 ? `${pc.substring(0, 3)} ${pc.substring(3)}` : pc;
      parts.push(formattedPC);
    }
    return parts.join(', ');
  };

  const customerName = billTo.firstName && billTo.lastName 
    ? `${billTo.firstName} ${billTo.lastName}` 
    : billTo.name || "Customer Name";

  // Calculate monthly payment dynamically using proper defaults
  const calculateMonthlyPayment = () => {
    const principal = financing.loanAmount || 0;
    const term = financing.amortizationPeriod || 180;
    const rate = (financing.interestRate || 0) / 100 / 12;
    
    if (principal === 0 || term === 0) return 0;
    
    if (rate === 0) {
      return principal / term;
    }
    
    return principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
  };

  const isMultiPage = data.pageNumber && data.totalPages && data.totalPages > 1;
  const isFirstPage = !data.pageNumber || data.pageNumber === 1;
  const isLastPage = !data.pageNumber || data.pageNumber === data.totalPages;

  return (
    <BaseTemplate data={data}>
      <div className="bg-white h-full flex flex-col">
        {/* Header section - only on first page */}
        {isFirstPage && (
          <>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{color: '#194578'}}>
                  {isInvoice ? 'INVOICE' : 'QUOTE'}
                </h1>
                <div className="flex items-baseline gap-1 text-sm mb-1">
                  <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'}#:</span>
                  <span>{invoice.number || 'N/A'}</span>
                </div>
                <div className="flex items-baseline gap-1 text-sm mb-1">
                  <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'} Date:</span>
                  <span>
                    {invoice.date
                      ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), 'America/Toronto', 'MMM dd, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-sm">
                  <span className="font-semibold">{isInvoice ? 'Due Date' : 'Valid Until'}:</span>
                  <span>
                    {invoice.paymentDate
                      ? formatInTimeZone(new Date(invoice.paymentDate + 'T12:00:00'), 'America/Toronto', 'MMM dd, yyyy')
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {yourCompany.logo && (
                  <img src={yourCompany.logo} alt={yourCompany.name || "Company Logo"} className={`${yourCompany.logoSize || 'h-16'} mb-1 ml-auto object-contain`} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded" style={{backgroundColor: '#f8f9fa'}}>
                <h3 className="text-sm font-semibold mb-2" style={{color: '#194578'}}>
                  {isInvoice ? 'Invoice' : 'Quote'} For
                </h3>
                <p className="text-sm">
                  <strong>{customerName}</strong>
                </p>
                <p className="text-xs">
                  {billTo.address && `${billTo.address}`}
                  {billTo.city && `, ${billTo.city}`}
                  {billTo.province && `, ${billTo.province}`}
                  {billTo.postalCode && ` ${billTo.postalCode}`}
                </p>
                <p className="text-xs">{formatPhoneNumber(billTo.phone) || ""}</p>
                <p className="text-xs">{billTo.email || ""}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded" style={{backgroundColor: '#f8f9fa'}}>
                <h3 className="text-sm font-semibold mb-2" style={{color: '#194578'}}>
                  {isInvoice ? 'Invoice' : 'Quote'} From
                </h3>
                <p className="text-sm">
                  <strong>{yourCompany.name || "George's Plumbing and Heating"}</strong>
                </p>
                <p className="text-xs">
                  {yourCompany.address 
                    ? (() => {
                        const address = yourCompany.address;
                        // If address already has commas, use as is
                        if (address.includes(',')) {
                          return address;
                        }
                        // Find street number and name, then add comma before city
                        const parts = address.split(' ');
                        let streetEndIndex = -1;
                        
                        // Look for common street suffixes
                        for (let i = 0; i < parts.length; i++) {
                          const part = parts[i].toLowerCase();
                          if (part.includes('street') || part.includes('st') || 
                              part.includes('avenue') || part.includes('ave') ||
                              part.includes('road') || part.includes('rd') ||
                              part.includes('boulevard') || part.includes('blvd') ||
                              part.includes('drive') || part.includes('dr') ||
                              part.includes('lane') || part.includes('ln')) {
                            streetEndIndex = i;
                            break;
                          }
                        }
                        
                        if (streetEndIndex !== -1 && streetEndIndex < parts.length - 1) {
                          // Insert comma after street name
                          const streetPart = parts.slice(0, streetEndIndex + 1).join(' ');
                          const cityPart = parts.slice(streetEndIndex + 1).join(' ');
                          return `${streetPart}, ${cityPart}`;
                        }
                        
                        return address;
                      })()
                    : "14 Rathmine Street, London, ON N5Z 1Z3"
                  }
                </p>
                <p className="text-xs">{yourCompany.phone || "(519) 851-2704"}</p>
                <p className="text-xs">{yourCompany.email || "info@georgesplumbingandheating.ca"}</p>
              </div>
            </div>

            {/* Items Table - only on first page */}
            <div className="mb-4">
              <table className="w-full" style={{borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{backgroundColor: '#194578', color: 'white'}}>
                    <th className="py-2 px-3 text-left text-sm font-semibold" style={{width: '50%'}}>
                      Item & Description
                    </th>
                    <th className="py-2 px-3 text-right text-sm font-semibold" style={{width: '16.67%'}}>Qty.</th>
                    <th className="py-2 px-3 text-right text-sm font-semibold" style={{width: '16.67%'}}>Rate</th>
                    <th className="py-2 px-3 text-right text-sm font-semibold" style={{width: '16.67%'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff'}}>
                      <td className="pt-0.5 pb-2 px-3">
                        <div className="font-semibold text-sm mb-0.5">{`${index + 1}. ${item.name || "Item Name"}`}</div>
                        <div className="text-xs text-gray-600 whitespace-pre-line leading-tight">
                          {getProductDescription(item.productId) || item.description || "Item Description"}
                        </div>
                      </td>
                      <td className="pt-0.5 pb-2 px-3 text-right text-sm">
                        {item.quantity || 0}
                      </td>
                      <td className="pt-0.5 pb-2 px-3 text-right text-sm">
                        ${(item.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td className="pt-0.5 pb-2 px-3 text-right text-sm">
                        ${((item.quantity || 0) * (item.amount || 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex-1 mt-2">
              <div className="grid grid-cols-2 gap-2" style={{pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                <div style={{pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                  {/* Financing Section */}
                  {financing && (
                    <div className="mb-4 p-3 rounded" style={{backgroundColor: '#e8f5e8', border: '1px solid #90c695', pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                      <h3 className="text-sm font-semibold mb-2" style={{color: '#000000'}}>Financing Payment Details</h3>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <p><strong>Finance Company:</strong> {financing.financeCompany || "Financeit Canada Inc."}</p>
                        <p><strong>Loan Amount:</strong> ${(financing.loanAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (incl. ${Math.min((financing.loanAmount || 0) * 0.0149, 149).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} admin fee)</p>
                        <p><strong>Amortization Period:</strong> {financing.amortizationPeriod || 180} months</p>
                        <p><strong>Promotional Term:</strong> {financing.loanTerm || 24} months</p>
                        <p><strong>Interest Rate:</strong> {financing.interestRate || 0}%</p>
                        <p><strong>Monthly Payment:</strong> ${calculateMonthlyPayment().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                  <div className="p-3 rounded mb-4" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                    <div className="space-y-1">
                      <p className="flex justify-between text-sm">
                        <span>Sub Total:</span> 
                        <span>${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </p>
                      {taxPercentage > 0 && (
                        <p className="flex justify-between text-sm">
                          <span>Tax ({taxPercentage}%):</span> 
                          <span>${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </p>
                      )}
                      <hr className="my-2" style={{borderColor: '#dee2e6'}} />
                      <p className="flex justify-between font-bold text-base">
                        <span>Total:</span> 
                        <span>${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Notes - right under summary */}
                  {notes && (
                    <div className="mb-4" style={{pageBreakInside: 'avoid', breakInside: 'avoid'}}>
                      <h3 className="text-xs font-semibold mb-1" style={{color: '#194578'}}>Additional Notes</h3>
                      <p className="text-xs">{notes}</p>
                    </div>
                  )}

                  {/* Rebates Section */}
                  {rebatesIncentives && Object.values(rebatesIncentives).some(value => value > 0) && (
                    <div className="p-3 rounded" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                      <h3 className="text-sm font-semibold mb-2" style={{color: '#194578'}}>Rebates & Incentives</h3>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {rebatesIncentives.federalRebate > 0 && (
                          <p><strong>Canada Greener Homes Rebate:</strong> ${rebatesIncentives.federalRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        )}
                        {rebatesIncentives.provincialRebate > 0 && (
                          <p><strong>Enbridge Rebate:</strong> ${rebatesIncentives.provincialRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        )}
                        {rebatesIncentives.utilityRebate > 0 && (
                          <p><strong>Utility Rebate (Annual):</strong> ${(rebatesIncentives.utilityRebate * 12).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${rebatesIncentives.utilityRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month)</p>
                        )}
                        {rebatesIncentives.manufacturerRebate > 0 && (
                          <p><strong>Manufacturer Rebate:</strong> ${rebatesIncentives.manufacturerRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Signature Section - On every page (page 1 for first page) */}
        {isFirstPage && (
        <div className="mt-auto pt-2" style={{pageBreakInside: 'avoid'}}>
            <div className="flex gap-8 mb-2">
              <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                <h3 className="text-xs font-semibold mb-12" style={{color: '#194578'}}>Customer Signature</h3>
                {signature ? (
                  <div className="mb-1 flex items-center h-[120px]">
                    <img src={signature} alt="Customer Signature" style={SIGNATURE_STYLE} />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-400 mb-1 h-6 w-full"></div>
                )}
                <p className="text-xs text-gray-600">{customerName}</p>
                <p className="text-xs text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
              </div>
              {data.billTo?.coApplicantName && (
                <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                  <h3 className="text-xs font-semibold mb-12" style={{color: '#194578'}}>Co-Applicant Signature</h3>
                  {coApplicantSignature ? (
                    <div className="mb-1 flex items-center h-[120px]">
                      <img src={coApplicantSignature} alt="Co-Applicant Signature" style={SIGNATURE_STYLE} />
                    </div>
                  ) : (
                    <div className="border-b-2 border-gray-400 mb-1 h-6 w-full"></div>
                  )}
                  <p className="text-xs text-gray-600">{data.billTo.coApplicantName}</p>
                  <p className="text-xs text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
                </div>
              )}
            </div>
            {/* Signing Location Stamp */}
            {signingLocation && formatSigningLocation() && (
              <div className="text-center mt-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] text-gray-500">
                  Signed at: {formatSigningLocation()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Terms and Conditions - Only shown in PDF mode, not in preview */}
        {showTermsAndConditions && (
        <div style={{pageBreakBefore: 'always'}}>
            {/* Page 2 Header */}
            <div className="flex justify-between items-start mb-6 pt-4">
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{color: '#194578'}}>
                  TERMS & CONDITIONS
                </h1>
                <p className="text-sm mb-1">
                  <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'}#:</span>{" "}
                  {invoice.number || "N/A"}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Customer:</span> {customerName}
                </p>
              </div>
              <div className="text-right">
                {yourCompany.logo && (
                  <img src={yourCompany.logo} alt={yourCompany.name || "Company Logo"} className={`${yourCompany.logoSize || 'h-16'} mb-1 ml-auto object-contain`} />
                )}
              </div>
            </div>

            {/* Terms and Conditions Content */}
            <div className="mb-8">
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="mb-4">I hereby confirm that I have read, understand and agree to all of the terms and conditions contained in this sales agreement, that I have been given an express opportunity to accept or decline this sales agreement and to correct any errors immediately before entering into it, and that I have received a copy of this sales agreement from the seller on the date of my signature as set out below.</p>
                
                <p className="mb-2"><strong>1. Payment Terms:</strong> Payment is due as specified in this agreement. Late payments may be subject to additional charges.</p>
                
                <p className="mb-2"><strong>2. Warranty:</strong> All products and services are covered under manufacturer's warranty. Extended warranty options may be available.</p>
                
                <p className="mb-2"><strong>3. Cancellation Policy:</strong> Cancellations must be made in writing within 10 business days of signing. Deposits may be non-refundable.</p>
                
                <p className="mb-2"><strong>4. Installation:</strong> Installation dates are estimates and may be subject to change based on product availability and scheduling.</p>
                
                <p><strong>5. Liability:</strong> The seller is not liable for any indirect, incidental, or consequential damages arising from the use of products or services.</p>
              </div>
            </div>

            {/* Signature Section on Page 2 (Terms & Conditions) */}
            <div className="flex gap-8 mt-8">
              <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                <h3 className="text-sm font-semibold mb-14" style={{color: '#194578'}}>Customer Signature</h3>
                {signature ? (
                  <div className="mb-2 flex items-center border-b-2 border-gray-400 h-[120px]">
                    <img src={signature} alt="Customer Signature" style={SIGNATURE_STYLE} />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-400 mb-2 h-10 w-full"></div>
                )}
                <p className="text-sm text-gray-600">{customerName}</p>
                <p className="text-sm text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
              </div>
              {data.billTo?.coApplicantName && (
                <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                  <h3 className="text-sm font-semibold mb-14" style={{color: '#194578'}}>Co-Applicant Signature</h3>
                  {coApplicantSignature ? (
                    <div className="mb-2 flex items-center border-b-2 border-gray-400 h-[120px]">
                      <img src={coApplicantSignature} alt="Co-Applicant Signature" style={SIGNATURE_STYLE} />
                    </div>
                  ) : (
                    <div className="border-b-2 border-gray-400 mb-2 h-10 w-full"></div>
                  )}
                  <p className="text-sm text-gray-600">{data.billTo.coApplicantName}</p>
                  <p className="text-sm text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
                </div>
              )}
            </div>
            {/* Signing Location Stamp */}
            {signingLocation && formatSigningLocation() && (
              <div className="text-center mt-4 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Signed at: {formatSigningLocation()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Continuation page header - for pages beyond page 1 that are not the last page */}
        {!isFirstPage && !isLastPage && (
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{color: '#194578'}}>
                {isInvoice ? 'INVOICE' : 'QUOTE'} - CONTINUED
              </h1>
              <p className="text-sm mb-1">
                <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'}#:</span>{" "}
                {invoice.number || "N/A"}
              </p>
              <p className="text-sm mb-1">
                <span className="font-semibold">Customer:</span> {customerName}
              </p>
            </div>
            <div className="text-right">
              <img src="/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png" alt="Company Logo" className="h-16 mb-1 ml-auto" />
            </div>
          </div>
        )}

        {/* Signature Section - On continuation pages (not first, not last with T&C) */}
        {!isFirstPage && !isLastPage && (
        <div className="mt-auto pt-2" style={{pageBreakInside: 'avoid'}}>
            <div className="flex gap-8 mb-2">
              <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                <h3 className="text-xs font-semibold mb-12" style={{color: '#194578'}}>Customer Signature</h3>
                {signature ? (
                  <div className="mb-1 flex items-center h-[120px]">
                    <img src={signature} alt="Customer Signature" style={SIGNATURE_STYLE} />
                  </div>
                ) : (
                  <div className="border-b-2 border-gray-400 mb-1 h-6 w-full"></div>
                )}
                <p className="text-xs text-gray-600">{customerName}</p>
                <p className="text-xs text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
              </div>
              {data.billTo?.coApplicantName && (
                <div style={{flex: '0 0 auto', minWidth: '280px', maxWidth: '400px'}}>
                  <h3 className="text-xs font-semibold mb-12" style={{color: '#194578'}}>Co-Applicant Signature</h3>
                  {coApplicantSignature ? (
                    <div className="mb-1 flex items-center h-[120px]">
                      <img src={coApplicantSignature} alt="Co-Applicant Signature" style={SIGNATURE_STYLE} />
                    </div>
                  ) : (
                    <div className="border-b-2 border-gray-400 mb-1 h-6 w-full"></div>
                  )}
                  <p className="text-xs text-gray-600">{data.billTo.coApplicantName}</p>
                  <p className="text-xs text-gray-600">Date: {invoice.date ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy") : formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
                </div>
              )}
            </div>
            {/* Signing Location Stamp */}
            {signingLocation && formatSigningLocation() && (
              <div className="text-center mt-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] text-gray-500">
                  Signed at: {formatSigningLocation()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseTemplate>
  );
};

export default Template4;
