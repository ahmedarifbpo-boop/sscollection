
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content:
      "Welcome to S.S Collection. This Privacy Policy explains how information provided by customers through our website is collected and used when browsing, placing orders, or contacting us.",
  },
  {
    title: "2. Information We Collect",
    content:
      "When you use our website or place an order, we may collect:",
    list: [
      "Your name and contact details.",
      "Your phone number and email address, where provided.",
      "Your delivery and billing address.",
      "Order details, purchased products, and payment method.",
      "Information submitted through customer support, reviews, or return requests.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    content: "We use the information you provide for purposes including:",
    list: [
      "Processing and delivering your orders.",
      "Contacting you about order confirmation and delivery.",
      "Handling returns, refunds, and customer support requests.",
      "Managing applicable discounts, coupons, and rewards.",
      "Improving our website and shopping experience.",
      "Maintaining order and transaction records.",
    ],
  },
  {
    title: "4. Information Sharing",
    content:
      "We do not intend to publicly display your private contact or delivery information. Information may be shared with delivery, payment, or technical service providers when necessary to process your order or operate our website. We may also disclose information where required by law.",
  },
  {
    title: "5. Data Storage and Retention",
    content:
      "Information submitted through our website may be stored in our systems for order processing, customer support, record keeping, and other legitimate business purposes. We retain information for as long as reasonably necessary for these purposes or as required by applicable law.",
  },
  {
    title: "6. Cookies and Website Technology",
    content:
      "Our website may use cookies or similar technologies to support website functionality, maintain shopping sessions, and improve the browsing experience. You can manage cookie settings through your browser.",
  },
  {
    title: "7. Protecting Your Information",
    content:
      "We take reasonable steps to handle customer information responsibly. However, no method of online transmission or electronic storage can be guaranteed to be completely secure.",
  },
  {
    title: "8. Your Choices",
    content:
      "If you wish to correct information you have provided or have a question about how your information is handled, please contact our customer support team.",
  },
  {
    title: "9. Third-Party Services",
    content:
      "Our website may use third-party services to support payments, delivery, hosting, or other website operations. Those services may handle information according to their own privacy policies and practices.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy when our website, services, or business practices change. The latest version will be published on this page.",
  },
  {
    title: "11. Contact Us",
    content:
      "If you have questions about this Privacy Policy or your personal information, please contact S.S Collection through the contact details provided on our website.",
  },
];

export default function PrivacyPolicyPage() {
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
            <ShieldCheck size={30} />
          </div>

          <span
            style={{
              color: "#F85606",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "2px",
            }}
          >
            CUSTOMER INFORMATION
          </span>

          <h1
            style={{
              margin: "9px 0",
              color: "#171717",
              fontSize: "34px",
              fontWeight: 800,
            }}
          >
            Privacy Policy
          </h1>

          <p
            style={{
              maxWidth: "550px",
              margin: "0 auto",
              color: "#777",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            Your privacy matters to us. Learn how S.S Collection
            collects, uses, and handles your information.
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

              {section.list && (
                <ul
                  style={{
                    margin: "10px 0 0",
                    paddingLeft: "22px",
                    color: "#666",
                    fontSize: "14px",
                    lineHeight: 1.85,
                  }}
                >
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
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
