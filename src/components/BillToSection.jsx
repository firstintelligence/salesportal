import React from 'react';
import FloatingLabelInput from './FloatingLabelInput';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const BillToSection = ({ billTo, handleInputChange }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold mb-4">Bill To</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingLabelInput
          id="billToName"
          label="Name"
          value={billTo.name}
          onChange={handleInputChange}
          name="name"
        />
        <FloatingLabelInput
          id="billToPhone"
          label="Phone"
          value={billTo.phone}
          onChange={handleInputChange}
          name="phone"
        />
      </div>
      <FloatingLabelInput
        id="billToAddress"
        label="Address"
        value={billTo.address}
        onChange={handleInputChange}
        name="address"
        className="mt-4"
      />
    </div>
  );
};

export default BillToSection;