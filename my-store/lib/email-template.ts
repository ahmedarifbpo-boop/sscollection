export const generateOrderEmail = (
  orderNumber: string,
  customerName: string,
  verificationLink: string,
  total: number
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #F85606;">S.S Collection</h1>
      </div>
      
      <h2 style="color: #333;">Thank you for your order, ${customerName}!</h2>
      <p style="color: #666; font-size: 14px;">Your order <strong>#${orderNumber}</strong> has been successfully placed.</p>
      <p style="color: #666; font-size: 14px;">Total Amount: <strong>Rs. ${total.toLocaleString()}</strong> (Cash on Delivery)</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verificationLink}" style="background-color: #F85606; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Verify Your Order
        </a>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center;">
        Please click the button above to confirm your order. If you did not place this order, please ignore this email.
      </p>
    </div>
  `;
};