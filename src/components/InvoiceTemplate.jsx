import React from 'react';
import { getTemplate } from '../utils/templateRegistry';

const InvoiceTemplate = ({ data, templateNumber, showConsumerProtectionPage = false }) => {
  const Template = getTemplate(templateNumber);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Template data={data} />
    </div>
  );
};

export default InvoiceTemplate;
