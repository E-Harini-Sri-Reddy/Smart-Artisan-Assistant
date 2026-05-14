import Payment from "../models/Payment.js";

import { asyncHandler } from "../utils/asyncHandler.js";

/* =======================================================
   GET ALL PAYMENTS
======================================================= */

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().sort({
    createdAt: -1,
  });

  res.json(payments);
});

/* =======================================================
   CREATE PAYMENT
======================================================= */

export const createPayment = asyncHandler(async (req, res) => {
  const { customer, product, amount, status, paymentDate, notes } = req.body;

  const payment = await Payment.create({
    customer,
    product,
    amount,
    status,
    paymentDate,
    notes,
  });

  res.status(201).json(payment);
});

/* =======================================================
   UPDATE PAYMENT
======================================================= */

export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);

    throw new Error("Payment not found");
  }

  payment.customer = req.body.customer || payment.customer;

  payment.product = req.body.product || payment.product;

  payment.amount = req.body.amount || payment.amount;

  payment.status = req.body.status || payment.status;

  payment.paymentDate = req.body.paymentDate || payment.paymentDate;

  payment.notes = req.body.notes || payment.notes;

  const updatedPayment = await payment.save();

  res.json(updatedPayment);
});

/* =======================================================
   DELETE PAYMENT
======================================================= */

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);

    throw new Error("Payment not found");
  }

  await payment.deleteOne();

  res.json({
    message: "Payment deleted successfully",
  });
});
