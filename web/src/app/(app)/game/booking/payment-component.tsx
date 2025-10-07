"use client";

import { useState } from "react";
import { Button } from "@/blocks/button";
import { CreditCard, Lock } from "lucide-react";

interface PaymentComponentProps {
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  loading: boolean;
}

export function PaymentComponent({ 
  amount, 
  onPaymentSuccess, 
  onPaymentError, 
  loading 
}: PaymentComponentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      onPaymentError("Please fill in all payment fields");
      return;
    }

    setProcessing(true);

    try {
      // TODO: Replace with actual Stripe integration
      // For demo purposes, simulate a payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success (90% success rate for demo)
      if (Math.random() > 0.1) {
        onPaymentSuccess();
      } else {
        onPaymentError("Payment failed. Please try again.");
      }
    } catch (error) {
      onPaymentError("Payment processing error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={20} className="text-green-300" />
        <span className="text-green-300 text-sm font-medium">Secure Payment</span>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/70 text-sm mb-2">Expiry Date</label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">CVV</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
            placeholder="123"
            maxLength={4}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-white/70 text-sm mb-2">Cardholder Name</label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {/* Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={loading || processing || !cardNumber || !expiryDate || !cvv || !cardholderName}
        className="w-full h-[50px] flex items-center justify-center gap-2 mt-6"
        variant="default"
      >
        <CreditCard size={20} />
        {processing ? "Processing..." : `Pay $${amount}`}
      </Button>

      <p className="text-white/50 text-xs text-center mt-4">
        Your payment information is encrypted and secure. This is a demo payment form.
      </p>
    </div>
  );
}
