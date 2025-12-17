import React from 'react';
import { getTemplate } from '../utils/templateRegistry';
import ConsumerProtectionActPage from './templates/ConsumerProtectionActPage';

const InvoiceTemplate = ({ data, templateNumber }) => {
  const Template = getTemplate(templateNumber);
  
  // Extract company info for the Consumer Protection Act page
  const companyInfo = data?.yourCompany ? {
    name: data.yourCompany.name,
    address: data.yourCompany.address,
    phone: data.yourCompany.phone,
    email: data.yourCompany.email
  } : null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Template data={data} />
      <ConsumerProtectionActPage companyInfo={companyInfo} />
    </div>
  );
};

export default InvoiceTemplate;
