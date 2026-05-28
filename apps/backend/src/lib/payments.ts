const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
export const paymentsConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

// When a real gateway is configured, create an order here (Razorpay orders.create).
// Until then, return a mock order so the flow is testable end-to-end.
export const createOrder = async (amount: number, receipt: string) => {
  if (paymentsConfigured) {
    // TODO: integrate Razorpay — const order = await razorpay.orders.create({ amount: amount*100, currency:'INR', receipt });
    throw new Error('Real payment gateway not yet wired'); // never hit until keys + integration added
  }
  return { id: `mock_order_${Date.now()}`, amount, currency: 'INR', receipt, mock: true as const };
};

// Verify a gateway callback signature. Mock returns true.
export const verifyPaymentSignature = (_payload: Record<string, string>): boolean => {
  if (paymentsConfigured) {
    // TODO: verify Razorpay signature with RAZORPAY_KEY_SECRET (crypto HMAC).
    return false;
  }
  return true;
};
