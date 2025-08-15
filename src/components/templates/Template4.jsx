import React from 'react';
import { format } from 'date-fns';
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
  } = data || {};

  const customerName = billTo.firstName && billTo.lastName 
    ? `${billTo.firstName} ${billTo.lastName}` 
    : billTo.name || "Customer Name";

  // Calculate monthly payment dynamically
  const calculateMonthlyPayment = () => {
    if (!financing.loanAmount || !financing.loanTerm) return 0;
    
    const principal = financing.loanAmount;
    const rate = (financing.interestRate || 0) / 100 / 12;
    const term = financing.loanTerm;
    
    if (rate === 0) {
      return principal / term;
    }
    
    return principal * (rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
  };

  return (
    <BaseTemplate data={data}>
      <div className="bg-white p-3 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{color: '#194578'}}>QUOTE</h1>
            <p className="text-sm mb-1">
              <span className="font-semibold">Quote#:</span>{" "}
              {invoice.number || "N/A"}
            </p>
            <p className="text-sm mb-1">
              <span className="font-semibold">Quote Date:</span>{" "}
              {invoice.date
                ? format(new Date(invoice.date), "MMM dd, yyyy")
                : "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Valid Until:</span>{" "}
              {invoice.paymentDate
                ? format(new Date(invoice.paymentDate), "MMM dd, yyyy")
                : "N/A"}
            </p>
          </div>
          <div className="text-right">
            <img src="/lovable-uploads/62b81d29-a2f1-4fb2-85a9-c836aa3c2bb1.png" alt="Company Logo" className="h-[8.88rem] mb-1 ml-auto" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="bg-gray-100 p-1 rounded">
            <h3 className="text-sm font-semibold mb-0.5" style={{color: '#194578'}}>
              Quote For
            </h3>
            <p className="text-sm">
              <strong>{customerName}</strong>
            </p>
            <p className="text-xs">{billTo.email || ""}</p>
            <p className="text-xs">{billTo.phone || ""}</p>
            <p className="text-xs">
              {billTo.address && `${billTo.address}`}
              {billTo.city && `, ${billTo.city}`}
              {billTo.province && `, ${billTo.province}`}
              {billTo.postalCode && ` ${billTo.postalCode}`}
            </p>
          </div>
          <div className="bg-gray-100 p-1 rounded">
            <h3 className="text-sm font-semibold mb-0.5" style={{color: '#194578'}}>
              Quote From
            </h3>
            <p className="text-sm">
              <strong>{yourCompany.name || "George's Plumbing and Heating"}</strong>
            </p>
            <p className="whitespace-pre-line text-xs">{yourCompany.address || "14 Rathmine Street\nLondon, ON N5Z 1Z3"}</p>
            <p className="text-xs">{yourCompany.phone || "info@georgesplumbingandheating.ca"}</p>
          </div>
        </div>

        <table className="w-full mb-2 border border-gray-300">
          <thead style={{backgroundColor: '#194578', color: 'white'}}>
            <tr>
              <th className="p-1 text-left border border-gray-300 text-sm">
                Item #/Item Description
              </th>
              <th className="p-1 text-right border border-gray-300 text-sm">Qty.</th>
              <th className="p-1 text-right border border-gray-300 text-sm">Rate</th>
              <th className="p-1 text-right border border-gray-300 text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="bg-gray-100">
                <td className="p-1 border border-gray-300">
                  <div className="font-semibold text-sm">{`${index + 1}. ${item.name || "Item Name"}`}</div>
                  <div className="text-xs text-gray-600">
                    {getProductDescription(item.productId) || item.description || "Item Description"}
                  </div>
                </td>
                <td className="p-1 text-right border border-gray-300 text-sm">
                  {item.quantity || 0}
                </td>
                <td className="p-1 text-right border border-gray-300 text-sm">
                  ${(item.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="p-1 text-right border border-gray-300 text-sm">
                  ${((item.quantity || 0) * (item.amount || 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            {/* Financing Section */}
            {financing && (
              <div className="mb-2">
                <h3 className="text-sm font-semibold mb-1" style={{color: '#194578'}}>Financing Payment Details</h3>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <p><strong>Finance Company:</strong> {financing.financeCompany || "Financeit Canada Inc."}</p>
                  <p><strong>Loan Amount:</strong> ${(financing.loanAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p><strong>Admin Fee:</strong> ${Math.min((financing.loanAmount || 0) * 0.0149, 149).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p><strong>Amortization Period:</strong> {financing.amortizationPeriod || 180} months</p>
                  <p><strong>Loan Term:</strong> {financing.loanTerm || 24} months</p>
                  <p><strong>Interest Rate:</strong> {financing.interestRate || 0}%</p>
                  <p><strong>Monthly Payment:</strong> ${calculateMonthlyPayment().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
              </div>
            )}

            {/* Rebates Section */}
            {rebatesIncentives && Object.values(rebatesIncentives).some(value => value > 0) && (
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{color: '#194578'}}>Rebates & Incentives</h3>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {rebatesIncentives.federalRebate > 0 && (
                    <p><strong>Federal Rebate:</strong> ${rebatesIncentives.federalRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  )}
                  {rebatesIncentives.provincialRebate > 0 && (
                    <p><strong>Provincial Rebate:</strong> ${rebatesIncentives.provincialRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  )}
                  {rebatesIncentives.utilityRebate > 0 && (
                    <p><strong>Utility Rebate (Monthly):</strong> ${rebatesIncentives.utilityRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month</p>
                  )}
                  {rebatesIncentives.manufacturerRebate > 0 && (
                    <p><strong>Manufacturer Rebate:</strong> ${rebatesIncentives.manufacturerRebate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="flex justify-between text-sm mb-1">
              <span>Sub Total:</span> <span>${subTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </p>
            {taxPercentage > 0 && (
              <>
                <p className="flex justify-between text-sm mb-1">
                  <span>Tax({taxPercentage}%):</span> <span>${taxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </p>
              </>
            )}
            <hr className="my-1" />
            <p className="flex justify-between font-bold text-base mt-1">
              <span>Total:</span> <span>${grandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </p>
          </div>
        </div>


        {/* Terms and Conditions */}
        <div className="mb-1">
          <h3 className="text-xs font-semibold mb-0.5" style={{color: '#194578'}}>Terms and Conditions</h3>
          <div className="text-xs text-gray-700 leading-tight">
            <p>I hereby confirm that I have read, understand and agree to all of the terms and conditions contained in this sales agreement, that I have been given an express opportunity to accept or decline this sales agreement and to correct any errors immediately before entering into it, and that I have received a copy of this sales agreement from the seller on the date of my signature as set out below.</p>
          </div>
        </div>

        {notes && (
          <div className="mb-1">
            <h3 className="text-xs font-semibold mb-0.5" style={{color: '#194578'}}>Additional Notes</h3>
            <p className="text-xs">{notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3 className="text-xs font-semibold mb-1" style={{color: '#194578'}}>Customer Signature</h3>
              <div className="border-b-2 border-gray-300 mb-1 h-8"></div>
              <p className="text-xs text-gray-600">Customer Signature</p>
              <div className="border-b border-gray-300 mb-1 h-6 mt-2"></div>
              <p className="text-xs text-gray-600">Date</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-1" style={{color: '#194578'}}>Company Representative</h3>
              <div className="border-b-2 border-gray-300 mb-1 h-8"></div>
              <p className="text-xs text-gray-600">Authorized Signature</p>
              <div className="border-b border-gray-300 mb-1 h-6 mt-2"></div>
              <p className="text-xs text-gray-600">Date</p>
            </div>
          </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Template4;
