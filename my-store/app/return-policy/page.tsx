
import Link from "next/link";
import { RefreshCcw, ArrowLeft, PackageCheck } from "lucide-react";

const sections = [
  {
    title: "1. Return Request Period",
    content:
      "Customers may request a return within 15 business days after receiving their parcel. Return requests submitted after this period may not be accepted.",
  },
  {
    title: "2. How to Request a Return",
    content:
      "To request a return, use the return request form available on our website. You will be asked to provide your order details, contact information, and the reason for the return. Submitting a request does not automatically guarantee approval.",
  },
  {
    title: "3. Return Approval and Inspection",
    content:
      "Our team will review your request and provide further instructions. Once the returned parcel is received, the product will be inspected to check its condition and whether it is in its original state. Refund eligibility will be determined after this inspection.",
  },
  {
    title: "4. Change-of-Mind Returns",
    content:
      "If you wish to return a product because you no longer want it or have changed your mind, the product must be returned in its original condition. For approved change-of-mind returns, the customer is responsible for the applicable Cash on Delivery (COD), delivery, or return shipping charges. These charges will not be refunded.",
  },
  {
    title: "5. Wrong, Damaged, or Defective Products",
    content:
      "If you receive an incorrect, damaged, or defective product due to an error on our part, please contact us and submit a return request with the relevant details. Our team may ask you to provide an unboxing video or other supporting evidence to help verify the issue. If the claim is approved, the product amount and applicable COD charge will be refundable.",
  },
  {
    title: "6. Product Condition",
    content:
      "Returned products must be kept in their original condition. Products that have been used, damaged after delivery, or altered may not qualify for a refund. Please follow the return instructions provided by our team before sending any parcel back.",
  },
  {
    title: "7. Parcel Opening and Order Cancellation",
    content:
      "Where opening authorization is required, customers must not open the parcel before receiving permission from S.S Collection. If you no longer wish to receive an order, please inform our team during the order confirmation call so that it can be cancelled before dispatch. If the parcel has already been dispatched, you may submit a return request through our website, subject to this policy.",
  },
  {
    title: "8. Coupons and Referral Rewards",
    content:
      "If coupons, referral bonuses, or other promotional benefits were used when placing an order, their value will be deducted from the refundable amount, where applicable. The refund will be calculated based on the amount actually paid for the eligible product after applicable deductions.",
  },
  {
    title: "9. Refund Processing",
    content:
      "Refunds are processed only after the returned parcel has been received and inspected and the return request has been approved. The refundable amount will depend on the return reason, product condition, applicable delivery charges, and promotional deductions.",
  },
  {
    title: "10. Rejected Return Requests",
    content:
      "We reserve the right to reject a return request if it does not meet the conditions of this policy, if the product is not in its original condition, or if the submitted information does not support the return claim. Our team will communicate the decision to the customer.",
  },
  {
    title: "11. Contact Us",
    content:
      "For return or refund questions, please contact S.S Collection through the contact details provided on our website.",
  },
];

export default function ReturnPolicyPage() {
  return (
    <main
      style={{
        minHeight: "70vh",
        padding: "35px 20px 60px",
        background: "#f7f7f8",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            marginBottom: "25px",
            color: "#555",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <header
          style={{
            padding: "35px 25px",
            borderRadius: "16px",
            background: "#fff",
            textAlign: "center",
            border: "1px solid #eee",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 15px",
              borderRadius: "50%",
              background: "#fff0e9",
              color: "#F85606",
            }}
          >
            <RefreshCcw size={29} />
          </div>

          <span
            style={{
              color: "#F85606",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "2px",
            }}
          >
            CUSTOMER SERVICE
          </span>

          <h1
            style={{
              margin: "9px 0",
              color: "#171717",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            Return & Refund Policy
          </h1>

          <p
            style={{
              maxWidth: "570px",
              margin: "0 auto",
              color: "#777",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            Please read our return and refund guidelines before
            submitting a return request.
          </p>
        </header>

        <div
          style={{
            marginTop: "20px",
            padding: "22px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            border: "1px solid #f5d5c5",
            borderRadius: "13px",
            background: "#fff8f4",
          }}
        >
          <PackageCheck
            size={30}
            color="#F85606"
            style={{ flexShrink: 0 }}
          />

          <div>
            <h2
              style={{
                margin: "0 0 5px",
                color: "#222",
                fontSize: "16px",
                fontWeight: 750,
              }}
            >
              15 Business Days Return Window
            </h2>

            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              You can submit a return request within 15 business
              days of receiving your parcel.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "35px",
            border: "1px solid #eee",
            borderRadius: "16px",
            background: "#fff",
          }}
        >
          <p
            style={{
              margin: "0 0 25px",
              color: "#888",
              fontSize: "12px",
            }}
          >
            Last Updated: November 13, 2026
          </p>

          {sections.map((section) => (
            <section
              key={section.title}
              style={{ marginBottom: "27px" }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  color: "#222",
                  fontSize: "17px",
                  fontWeight: 750,
                }}
              >
                {section.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: 1.85,
                }}
              >
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div style={{ marginTop: "22px", textAlign: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 25px",
              borderRadius: "8px",
              background: "#F85606",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
