import React from 'react';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import BaseTemplate from './BaseTemplate';

import { getProductDescription } from '../../utils/productDescriptions';

const Template4 = ({ data }) => {
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
  } = data || {};

  const customerName = billTo.firstName && billTo.lastName 
    ? `${billTo.firstName} ${billTo.lastName}` 
    : billTo.name || "Customer Name";

  // Calculate monthly payment dynamically
  const calculateMonthlyPayment = () => {
    if (!financing.loanAmount || !financing.amortizationPeriod) return 0;
    
    const principal = financing.loanAmount;
    const rate = (financing.interestRate || 0) / 100 / 12;
    const term = financing.amortizationPeriod;
    
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
                <p className="text-sm mb-1">
                  <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'}#:</span>{" "}
                  {invoice.number || "N/A"}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">{isInvoice ? 'Invoice' : 'Quote'} Date:</span>{" "}
                  {invoice.date
                    ? formatInTimeZone(new Date(invoice.date + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy")
                    : "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">{isInvoice ? 'Due Date' : 'Valid Until'}:</span>{" "}
                  {invoice.paymentDate
                    ? formatInTimeZone(new Date(invoice.paymentDate + 'T12:00:00'), "America/Toronto", "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <img src="/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png" alt="Company Logo" className="h-[8.56rem] mb-1 ml-auto" />
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
                <p className="text-xs">{billTo.phone || ""}</p>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  {/* Financing Section */}
                  {financing && (
                    <div className="mb-4 p-3 rounded" style={{backgroundColor: '#e8f5e8', border: '1px solid #90c695'}}>
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
                <div>
                  <div className="p-3 rounded mb-4" style={{backgroundColor: '#f8f9fa', border: '1px solid #dee2e6'}}>
                    <h3 className="text-sm font-semibold mb-2" style={{color: '#194578'}}>Summary</h3>
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

        {/* Terms and Conditions and Additional Notes - only on last page */}
        {isLastPage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2" style={{pageBreakInside: 'avoid'}}>
            <div style={{pageBreakInside: 'avoid'}}>
              <h3 className="text-xs font-semibold mb-1" style={{color: '#194578'}}>Terms and Conditions</h3>
              <div className="text-xs text-gray-700 leading-tight">
                <p>I hereby confirm that I have read, understand and agree to all of the terms and conditions contained in this sales agreement, that I have been given an express opportunity to accept or decline this sales agreement and to correct any errors immediately before entering into it, and that I have received a copy of this sales agreement from the seller on the date of my signature as set out below.</p>
              </div>
            </div>
            
            {notes && (
              <div style={{pageBreakInside: 'avoid'}}>
                <h3 className="text-xs font-semibold mb-1" style={{color: '#194578'}}>Additional Notes</h3>
                <p className="text-xs">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Continuation page header */}
        {!isFirstPage && (
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{color: '#194578'}}>
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
              <img src="/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png" alt="Company Logo" className="h-[8.56rem] mb-1 ml-auto" />
            </div>
          </div>
        )}

        {/* Signature Section - Always at bottom of every page */}
        <div className="mt-auto pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold mb-2" style={{color: '#194578'}}>Customer Signature</h3>
              <div className="border-b-2 border-gray-400 mb-2 h-8"></div>
              <p className="text-xs text-gray-600">{customerName}</p>
              <p className="text-xs text-gray-600 mt-1">Date: {formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
            </div>
            {data.billTo?.coApplicantName && (
              <div>
                <h3 className="text-xs font-semibold mb-2" style={{color: '#194578'}}>Co-Applicant Signature</h3>
                <div className="border-b-2 border-gray-400 mb-2 h-8"></div>
                <p className="text-xs text-gray-600">{data.billTo.coApplicantName}</p>
                <p className="text-xs text-gray-600 mt-1">Date: {formatInTimeZone(new Date(), "America/Toronto", "MMM dd, yyyy")}</p>
              </div>
            )}
            {!data.billTo?.coApplicantName && <div></div>}
          </div>
          
          {/* Page number - show on all pages when multi-page */}
          {isMultiPage && (
            <div className="text-center mt-4 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Page {data.pageNumber || 1} of {data.totalPages || 1}</p>
            </div>
          )}
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template4;
