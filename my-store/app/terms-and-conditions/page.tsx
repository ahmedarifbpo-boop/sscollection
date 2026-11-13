
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using the S.S Collection website, you agree to these Terms and Conditions. If you do not agree with these terms, please do not use our website.",
  },
  {
    title: "2. Products and Availability",
    content:
      "We aim to display accurate product descriptions, images, prices, and availability. However, product colours, appearance, or packaging may vary slightly. Products are subject to availability, and we reserve the right to update or discontinue products without prior notice.",
  },
  {
    title: "3. Pricing and Payments",
    content:
      "All prices are displayed in Pakistani Rupees (PKR), unless stated otherwise. Prices and promotional offers may change without prior notice. Available payment methods, including Cash on Delivery, will be displayed during checkout. Orders may be subject to confirmation before dispatch.",
  },
  {
    title: "4. Orders and Confirmation",
    content:
      "Placing an order through our website represents a request to purchase the selected products. We may contact you to confirm your order and delivery details. We reserve the right to cancel or decline an order where necessary, including in cases of incorrect information, product unavailability, or suspected misuse.",
  },
  {
    title: "5. Customer Information",
    content:
      "You are responsible for providing accurate contact and delivery information when placing an order. Incorrect or incomplete information may affect order confirmation or delivery. Please review your details carefully before submitting an order.",
  },
  {
    title: "6. Shipping and Delivery",
    content:
      "Delivery arrangements and applicable charges will be communicated during the ordering process or through our customer support. Delivery times may vary depending on location, courier availability, and other circumstances beyond our control.",
  },
  {
    title: "7. Returns and Refunds",
    content:
      "All return and refund requests are governed by our Return & Refund Policy. Customers should review that policy before submitting a return request. Refund eligibility is subject to the applicable conditions and product inspection.",
  },
  {
    title: "8. Coupons and Promotional Offers",
    content:
      "Coupons, discounts, referral bonuses, and other promotional offers are subject to their applicable conditions. Offers may be changed, limited, or withdrawn. Promotional benefits cannot be assumed to be redeemable for cash unless expressly stated.",
  },
  {
    title: "9. Coins and Rewards",
    content:
      "Any coins, points, or rewards offered through S.S Collection are subject to the rules displayed on our website or communicated by our team. We reserve the right to correct errors or review suspected misuse of reward benefits.",
  },
  {
    title: "10. Customer Reviews",
    content:
      "Customers must submit honest and relevant product reviews. Reviews must not contain abusive, misleading, unlawful, or inappropriate content. We reserve the right to review, moderate, or remove content that violates these conditions.",
  },
  {
    title: "11. Website Use",
    content:
      "You agree not to misuse our website, interfere with its operation, attempt unauthorized access, submit false information, or engage in activities that may harm our business, customers, or services.",
  },
  {
    title: "12. Intellectual Property",
    content:
      "Website content, including text, graphics, branding, logos, images, and design elements, belongs to S.S Collection or its respective owners and may not be copied, reproduced, or used commercially without appropriate permission.",
  },
  {
    title: "13. Limitation of Liability",
    content:
      "To the extent permitted by applicable law, S.S Collection will not be responsible for indirect or consequential losses arising from website use, service interruptions, or circumstances beyond our reasonable control.",
  },
  {
    title: "14. Changes to These Terms",
    content:
      "We may update these Terms and Conditions from time to time. Updated terms will be published on this page. Your continued use of the website after changes are published indicates acceptance of the updated terms, to the extent permitted by applicable law.",
  },
  {
    title: "15. Contact Us",
    content:
      "If you have questions about these Terms and Conditions, please contact S.S Collection through the contact details provided on our website.",
  },
];

export default function TermsAndConditionsPage() {
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
            <FileText size={29} />
          </div>

          <span
            style={{
              color: "#F85606",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "2px",
            }}
          >
            WEBSITE GUIDELINES
          </span>

          <h1
            style={{
              margin: "9px 0",
              color: "#171717",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            Terms & Conditions
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
            Please read these terms carefully before using
            S.S Collection and placing an order.
          </p>
        </header>

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
