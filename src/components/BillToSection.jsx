import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import AddressLookupService from '../utils/addressLookupService';
import { formatPhoneNumber } from '../utils/inputFormatting';

const BillToSection = ({ billTo, handleInputChange }) => {
  const provinces = [
    { code: 'AB', name: 'Alberta', tax: 5 },
    { code: 'BC', name: 'British Columbia', tax: 12 },
    { code: 'MB', name: 'Manitoba', tax: 12 },
    { code: 'NB', name: 'New Brunswick', tax: 15 },
    { code: 'NL', name: 'Newfoundland and Labrador', tax: 15 },
    { code: 'NS', name: 'Nova Scotia', tax: 15 },
    { code: 'NT', name: 'Northwest Territories', tax: 5 },
    { code: 'NU', name: 'Nunavut', tax: 5 },
    { code: 'ON', name: 'Ontario', tax: 13 },
    { code: 'PE', name: 'Prince Edward Island', tax: 15 },
    { code: 'QC', name: 'Quebec', tax: 14.975 },
    { code: 'SK', name: 'Saskatchewan', tax: 11 },
    { code: 'YT', name: 'Yukon', tax: 5 }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg md:text-2xl font-semibold mb-4">Bill To</h2>
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <FloatingLabelInput
          id="billToFirstName"
          label="First Name"
          value={billTo.firstName || ''}
          onChange={handleInputChange}
          name="firstName"
          className="text-xs md:text-sm"
        />
        <FloatingLabelInput
          id="billToLastName"
          label="Last Name"
          value={billTo.lastName || ''}
          onChange={handleInputChange}
          name="lastName"
          className="text-xs md:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-4">
        <FloatingLabelInput
          id="billToEmail"
          label="Email"
          type="email"
          value={billTo.email || ''}
          onChange={handleInputChange}
          name="email"
          className="text-xs md:text-sm"
        />
        <FloatingLabelInput
          id="billToPhone"
          label="Phone"
          value={billTo.phone || ''}
          onChange={handleInputChange}
          onBlur={(e) => {
            const formatted = formatPhoneNumber(e.target.value);
            handleInputChange({ target: { name: 'phone', value: formatted } });
          }}
          name="phone"
          className="text-xs md:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-4">
        <FloatingLabelInput
          id="billToAddress"
          label="Address"
          value={billTo.address || ''}
          onChange={handleInputChange}
          name="address"
          className="text-xs md:text-sm"
        />
        <FloatingLabelInput
          id="billToCity"
          label="City"
          value={billTo.city || ''}
          onChange={handleInputChange}
          name="city"
          className="text-xs md:text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-4">
        <div>
          <Select value={billTo.province || ''} onValueChange={(value) => handleInputChange({ target: { name: 'province', value } })}>
            <SelectTrigger className="min-h-[40px] md:h-[40px] h-[48px] text-sm bg-white border-gray-300">
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {provinces.map((prov) => (
                <SelectItem key={prov.code} value={prov.code} className="text-sm">
                  {prov.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative">
          <FloatingLabelInput
            id="billToPostalCode"
            label="Postal Code"
            value={billTo.postalCode || ''}
            onChange={handleInputChange}
            name="postalCode"
            isPostalCode={true}
            className="text-xs md:text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-[3px] top-1/2 -translate-y-1/2 h-[calc(100%-6px)] px-1.5 md:px-2 text-xs"
            onClick={async () => {
              try {
                const postalCode = await AddressLookupService.lookupPostalCode(
                  billTo.address, 
                  billTo.city, 
                  billTo.province
                );
                handleInputChange({ target: { name: 'postalCode', value: postalCode } });
              } catch (error) {
                console.error('Postal code lookup failed:', error);
                // Still generate an estimated postal code on error
                const estimatedCode = AddressLookupService.generateEstimatedPostalCode(billTo.city, billTo.province);
                handleInputChange({ target: { name: 'postalCode', value: estimatedCode } });
              }
            }}
            disabled={!billTo.address || !billTo.city || !billTo.province}
          >
            Lookup
          </Button>
        </div>
      </div>
      
      {/* Co-Applicant Section */}
      <div className="mt-2 md:mt-4">
        <Button
          type="button"
          variant={billTo.coApplicantName ? "outline" : "success"}
          size="sm"
          className="w-1/2 md:w-full"
          onClick={() => {
            const currentValue = billTo.coApplicantName || '';
            if (currentValue) {
              // Clear co-applicant info
              handleInputChange({ target: { name: 'coApplicantName', value: '' } });
              handleInputChange({ target: { name: 'coApplicantPhone', value: '' } });
            } else {
              // Enable co-applicant section
              handleInputChange({ target: { name: 'coApplicantName', value: 'Co-Applicant Name' } });
            }
          }}
        >
          {billTo.coApplicantName ? 'Remove Co-Applicant' : '+ Add Co-Applicant'}
        </Button>
        
        {billTo.coApplicantName && (
          <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-4 p-2 md:p-4 bg-gray-50 rounded-lg">
            <FloatingLabelInput
              id="coApplicantName"
              label="Co-Applicant Name"
              value={billTo.coApplicantName || ''}
              onChange={handleInputChange}
              name="coApplicantName"
              className="text-xs md:text-sm"
            />
            <FloatingLabelInput
              id="coApplicantPhone"
              label="Co-Applicant Phone"
              value={billTo.coApplicantPhone || ''}
              onChange={handleInputChange}
              onBlur={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                handleInputChange({ target: { name: 'coApplicantPhone', value: formatted } });
              }}
              name="coApplicantPhone"
              className="text-xs md:text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillToSection;