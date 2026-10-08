import Payment from "../models/Payment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { organizationResourceFilter } from "../utils/tenantScope.js";

/* =======================================================
   GET ALL PAYMENTS (organization-scoped for org admins)
======================================================= */

export const getPayments = asyncHandler(async (req, res) => {
  if (!req.auth.isOrgAdmin) {
    res.status(403);
    throw new Error("Organization admin access required");
  }

  const payments = await Payment.find(
    organizationResourceFilter(req.auth),
  ).sort({ createdAt: -1 });

  res.json(payments);
});

/* =======================================================
   CREATE PAYMENT
======================================================= */

export const createPayment = asyncHandler(async (req, res) => {
  if (!req.auth.isOrgAdmin) {
    res.status(403);
    throw new Error("Organization admin access required");
  }

  const { customer, product, amount, status, paymentDate, notes } = req.body;

  // Ignore client-supplied organization / user IDs
  const payment = await Payment.create({
    customer,
    product,
    amount,
    status,
    paymentDate,
    notes,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });

  res.status(201).json(payment);
});

/* =======================================================
   UPDATE PAYMENT
======================================================= */

export const updatePayment = asyncHandler(async (req, res) => {
  if (!req.auth.isOrgAdmin) {
    res.status(403);
    throw new Error("Organization admin access required");
  }

  const payment = await Payment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  payment.customer = req.body.customer || payment.customer;
  payment.product = req.body.product || payment.product;
  payment.amount = req.body.amount ?? payment.amount;
  payment.status = req.body.status || payment.status;
  payment.paymentDate = req.body.paymentDate || payment.paymentDate;
  payment.notes = req.body.notes ?? payment.notes;

  const updatedPayment = await payment.save();
  res.json(updatedPayment);
});

/* =======================================================
   DELETE PAYMENT
======================================================= */

export const deletePayment = asyncHandler(async (req, res) => {
  if (!req.auth.isOrgAdmin) {
    res.status(403);
    throw new Error("Organization admin access required");
  }

  const payment = await Payment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  await payment.deleteOne();

  res.json({
    message: "Payment deleted successfully",
  });
});
