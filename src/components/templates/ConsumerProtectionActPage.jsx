import React from 'react';

const ConsumerProtectionActPage = ({ companyInfo }) => {
  const { name, address, phone, email } = companyInfo || {};

  return (
    <div 
      className="bg-white mx-auto"
      style={{ 
        width: "794px", 
        height: "1123px",
        padding: "48px 54px",
        boxSizing: "border-box",
        pageBreakBefore: "always",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden"
      }}
    >
      <h2 style={{ 
        fontSize: "14px", 
        fontWeight: "bold", 
        textDecoration: "underline",
        marginBottom: "16px"
      }}>
        YOUR RIGHTS UNDER THE CONSUMER PROTECTION ACT, 2002
      </h2>

      <p style={{ 
        fontSize: "12px", 
        fontWeight: "bold", 
        lineHeight: "1.5",
        marginBottom: "12px"
      }}>
        You may cancel this Agreement at any time during the period that ends ten (10) days after the day you receive a written copy of the Agreement. You do not need to give the supplier a reason for cancelling during this 10-day period.
      </p>

      <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
        If the supplier does not make delivery within 30 days after the delivery date specified in this Agreement or if the supplier does not begin performance of his, her or its obligations within 30 days after the commencement date specified in this Agreement, you may cancel this agreement at any time before delivery or commencement if performance. You lose the right to cancel if, after the 30-day period has expired, you agree to accept delivery or authorize commencement of performance. If the delivery date or commencement date is not specified in this Agreement and the supplier does not deliver or commence performance within 30 days after the date this Agreement is entered into, you may cancel this Agreement at any time before delivery or commencement of performance. You lose the right to cancel, if after the 30-dat period has expired, you agree to accept delivery or authorize commencement of performance. In addition, there are other grounds that allow you to cancel this Agreement. You may also have other rights, duties and remedies at law.
      </p>

      <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
        For more information, you may contact the Ministry of Consumer and Business Services. To cancel this Agreement, you must give notice of cancellation to the supplier, at the address set out in the Agreement, by any means that allows you to prove the date on which you gave notice. If no address is set out in the Agreement, use any address of the supplier that is on record with the Government of Ontario or the Government of Canada or is known by you.
      </p>

      <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
        If you cancel this Agreement, the supplier has fifteen (15) days to refund any payment you have made and return to you all goods delivered under a trade-in arrangement (or refund an amount equal to the trade-in allowance). However, if you cancel this Agreement after having solicited the goods or services from the supplier and having requested that delivery be made or performance be commenced within ten (10) days after the date this Agreement is entered into, the supplier is entitled to reasonable compensation or the goods and services that you received before the earlier is entitled to reasonable compensation or the goods and services that you received before the earlier of the 11th day after the date this Agreement was entered into and the date on which you gave notice of any cancellation to the supplier, except goods that can be repossessed by or returned to the supplier.
      </p>

      <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
        If the supplier requests in writing repossession of any goods that came into you possession under the Agreement, you must return the goods to the supplier's address or all one of the following persons, to repossess the goods at your address.
      </p>

      <div style={{ marginLeft: "32px", marginBottom: "10px" }}>
        <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "4px" }}>
          a) The supplier.
        </p>
        <p style={{ fontSize: "12px", lineHeight: "1.5" }}>
          b) A person designated in writing by the supplier.
        </p>
      </div>

      <p style={{ fontSize: "12px", lineHeight: "1.5", marginBottom: "10px" }}>
        If you cancel this Agreement, you must take reasonable care of any goods that came into your possession under the Agreement until one of the following happens:
      </p>

      <div style={{ marginLeft: "32px", marginBottom: "16px" }}>
        <p style={{ fontSize: "12px", lineHeight: "1.6", marginBottom: "4px" }}>
          a) The supplier repossesses the goods.
        </p>
        <p style={{ fontSize: "12px", lineHeight: "1.6", marginBottom: "4px" }}>
          b) The supplier has been given a reasonable opportunity to repossess the goods and twenty-one (21) days have passed since the Agreement was cancelled.
        </p>
        <p style={{ fontSize: "12px", lineHeight: "1.6", marginBottom: "4px" }}>
          c) You return the goods.
        </p>
        <p style={{ fontSize: "12px", lineHeight: "1.6" }}>
          d) The supplier directs you in writing to destroy the goods and you do so in accordance with the supplier's instructions.
        </p>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
          For more information contact:
        </p>
        {name && (
          <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
            <p style={{ fontWeight: "bold" }}>{name}</p>
            {address && <p>{address}</p>}
            {phone && <p>{phone}</p>}
            {email && <p>{email}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerProtectionActPage;
