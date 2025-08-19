import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generatePostalCode } from '../utils/postalCodeGenerator';

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
      <h2 className="text-2xl font-semibold mb-4">Bill To</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingLabelInput
          id="billToFirstName"
          label="First Name"
          value={billTo.firstName || ''}
          onChange={handleInputChange}
          name="firstName"
        />
        <FloatingLabelInput
          id="billToLastName"
          label="Last Name"
          value={billTo.lastName || ''}
          onChange={handleInputChange}
          name="lastName"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FloatingLabelInput
          id="billToEmail"
          label="Email"
          type="email"
          value={billTo.email || ''}
          onChange={handleInputChange}
          name="email"
        />
        <FloatingLabelInput
          id="billToPhone"
          label="Phone"
          value={billTo.phone || ''}
          onChange={handleInputChange}
          name="phone"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FloatingLabelInput
          id="billToAddress"
          label="Address"
          value={billTo.address || ''}
          onChange={handleInputChange}
          name="address"
        />
        <FloatingLabelInput
          id="billToCity"
          label="City"
          value={billTo.city || ''}
          onChange={handleInputChange}
          name="city"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Select value={billTo.province || ''} onValueChange={(value) => handleInputChange({ target: { name: 'province', value } })}>
            <SelectTrigger className="h-[40px]">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((prov) => (
                <SelectItem key={prov.code} value={prov.code}>
                  {prov.name}
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
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-1 top-1 bottom-1 px-2 text-xs"
            onClick={() => {
              const postalCode = generatePostalCode(billTo.city, billTo.province);
              handleInputChange({ target: { name: 'postalCode', value: postalCode } });
            }}
            disabled={!billTo.city || !billTo.province}
          >
            Generate
          </Button>
        </div>
      </div>
      
      {/* Co-Applicant Section */}
      <div className="mt-6 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Co-Applicant (Optional)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
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
            {billTo.coApplicantName ? 'Remove Co-Applicant' : 'Add Co-Applicant'}
          </Button>
        </div>
        
        {billTo.coApplicantName && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="coApplicantName"
              label="Co-Applicant Name"
              value={billTo.coApplicantName || ''}
              onChange={handleInputChange}
              name="coApplicantName"
            />
            <FloatingLabelInput
              id="coApplicantPhone"
              label="Co-Applicant Phone"
              value={billTo.coApplicantPhone || ''}
              onChange={handleInputChange}
              name="coApplicantPhone"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillToSection;