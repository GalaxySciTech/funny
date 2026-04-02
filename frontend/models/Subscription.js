import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["monthly", "yearly"], required: true },
    status: { type: String, enum: ["active", "cancelled", "expired", "pending"], default: "active" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },
    amountPaid: { type: Number, required: true },
    currency: { type: String, default: "CNY" },
    paymentMethod: { type: String, default: "simulated" },
    transactionId: { type: String, default: "" },
    renewalCount: { type: Number, default: 0 },
    lastRenewalDate: { type: Date, default: null },
    discountApplied: { type: String, default: "" },
    originalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
