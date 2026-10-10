import Product from "../models/Product.js";
import ProductAssignment from "../models/ProductAssignment.js";
import AssignmentPayment from "../models/AssignmentPayment.js";
import Production from "../models/Production.js";
import Membership from "../models/Membership.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ASSIGNMENT_TYPES = [
  "Installation",
  "Repair",
  "Customization",
  "Inspection",
  "Other",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const parseListField = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const mapUploadedFiles = (files = []) =>
  files.map((f) => ({
    name: f.originalname,
    url: `/uploads/${f.filename}`,
    mimeType: f.mimetype,
  }));

const nextAssignmentNumber = async (organizationId) => {
  const count = await ProductAssignment.countDocuments({
    organization: organizationId,
  });
  return `ASG-${1000 + count + 1}`;
};

const assignmentPopulate = [
  { path: "product" },
  { path: "user", select: "name email profession" },
  { path: "assignedBy", select: "name email" },
  { path: "priceMessages.user", select: "name email" },
];

const parsePayAmount = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) return null;
  return amount;
};

const populateAssignmentQuery = (query) => query.populate(assignmentPopulate);

const populateAssignmentDoc = async (doc) => {
  await doc.populate(assignmentPopulate);
  return doc;
};

export const listProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    organization: req.auth.organizationId,
  }).sort({ createdAt: -1 });
  res.json(products);
});

const UNIT_CATEGORIES = ["count", "weight", "liquid", "length"];

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, unit, unitCategory } = req.body;
  if (!name?.trim()) {
    res.status(400);
    throw new Error("Product name is required");
  }
  const category = UNIT_CATEGORIES.includes(unitCategory)
    ? unitCategory
    : "count";
  const product = await Product.create({
    name: name.trim(),
    description: description || "",
    price: price ?? 0,
    unit: unit || "pcs",
    unitCategory: category,
    image: req.file ? `/uploads/${req.file.filename}` : "",
    organization: req.auth.organizationId,
    createdBy: req.auth.userId,
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const { name, description, price, unit, unitCategory } = req.body;
  if (name !== undefined) product.name = name.trim();
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (unit !== undefined) product.unit = unit;
  if (unitCategory !== undefined) {
    if (!UNIT_CATEGORIES.includes(unitCategory)) {
      res.status(400);
      throw new Error("Invalid unit category");
    }
    product.unitCategory = unitCategory;
  }
  if (req.file) {
    product.image = `/uploads/${req.file.filename}`;
  }
  await product.save();
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  await ProductAssignment.deleteMany({
    product: product._id,
    organization: req.auth.organizationId,
  });
  res.json({ message: "Product deleted" });
});

export const assignProduct = asyncHandler(async (req, res) => {
  const {
    productId,
    userId,
    assignmentType = "Customization",
    quantity = 1,
    priority = "Medium",
    offeredPay,
    dueDate,
    location,
    notes,
    requiredMaterials,
    requiredSkills,
  } = req.body;

  if (!productId || !userId) {
    res.status(400);
    throw new Error("Product and artisan are required");
  }
  if (!ASSIGNMENT_TYPES.includes(assignmentType)) {
    res.status(400);
    throw new Error("Invalid assignment type");
  }
  if (!PRIORITIES.includes(priority)) {
    res.status(400);
    throw new Error("Invalid priority");
  }
  const payAmount = parsePayAmount(offeredPay);
  if (payAmount === null) {
    res.status(400);
    throw new Error("Offered pay is required and must be a valid amount");
  }
  const product = await Product.findOne({
    _id: productId,
    organization: req.auth.organizationId,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found in your organization");
  }

  const targetMembership = await Membership.findOne({
    user: userId,
    organization: req.auth.organizationId,
    status: "active",
    role: "user",
  });
  if (!targetMembership) {
    res.status(400);
    throw new Error(
      "Target artisan is not an active organization user in your organization",
    );
  }

  const assignment = await ProductAssignment.create({
    assignmentNumber: await nextAssignmentNumber(req.auth.organizationId),
    product: product._id,
    user: userId,
    organization: req.auth.organizationId,
    assignedBy: req.auth.userId,
    assignmentType,
    quantity: Math.max(1, Number(quantity) || 1),
    priority,
    status: "Assigned",
    offeredPay: payAmount,
    priceMessages: [
      {
        role: "admin",
        user: req.auth.userId,
        message: `Initial offered pay: ₹${payAmount.toLocaleString("en-IN")}`,
        proposedPay: payAmount,
      },
    ],
    dueDate: dueDate || null,
    startDate: null,
    estimatedCompletionDate: null,
    location: location || "",
    notes: notes || "",
    requiredMaterials: parseListField(requiredMaterials),
    requiredSkills: parseListField(requiredSkills),
    attachments: mapUploadedFiles(req.files),
  });

  await populateAssignmentDoc(assignment);
  res.status(201).json(assignment);
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const fields = [
    "assignmentType",
    "quantity",
    "priority",
    "status",
    "dueDate",
    "startDate",
    "estimatedCompletionDate",
    "location",
    "notes",
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) {
      assignment[key] = req.body[key] === "" ? null : req.body[key];
    }
  }
  if (req.body.offeredPay !== undefined) {
    if (assignment.status !== "Assigned") {
      res.status(400);
      throw new Error("Pay can only be updated while the assignment is pending");
    }
    const payAmount = parsePayAmount(req.body.offeredPay);
    if (payAmount === null) {
      res.status(400);
      throw new Error("Offered pay must be a valid amount");
    }
    assignment.offeredPay = payAmount;
  }
  if (req.body.requiredMaterials !== undefined) {
    assignment.requiredMaterials = parseListField(req.body.requiredMaterials);
  }
  if (req.body.requiredSkills !== undefined) {
    assignment.requiredSkills = parseListField(req.body.requiredSkills);
  }
  if (req.files?.length) {
    assignment.attachments = [
      ...assignment.attachments,
      ...mapUploadedFiles(req.files),
    ];
  }
  if (req.body.userId) {
    const targetMembership = await Membership.findOne({
      user: req.body.userId,
      organization: req.auth.organizationId,
      status: "active",
      role: "user",
    });
    if (!targetMembership) {
      res.status(400);
      throw new Error("Target artisan is not an active organization user");
    }
    assignment.user = req.body.userId;
  }

  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const unassignProduct = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOneAndDelete({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  res.json({ message: "Assignment removed" });
});

export const listAssignments = asyncHandler(async (req, res) => {
  const assignments = await populateAssignmentQuery(
    ProductAssignment.find({
      organization: req.auth.organizationId,
    }).sort({ createdAt: -1 }),
  );
  res.json(assignments);
});

export const listMyAssignments = asyncHandler(async (req, res) => {
  if (!req.auth.organizationId) {
    return res.json([]);
  }
  const assignments = await populateAssignmentQuery(
    ProductAssignment.find({
      user: req.auth.userId,
      organization: req.auth.organizationId,
      status: { $nin: ["Cancelled"] },
    }).sort({ dueDate: 1, createdAt: -1 }),
  );
  res.json(assignments);
});

export const getAssignment = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.auth.isOrgAdmin) {
    filter.organization = req.auth.organizationId;
  } else {
    filter.user = req.auth.userId;
    if (req.auth.organizationId) {
      filter.organization = req.auth.organizationId;
    }
  }

  const assignment = await populateAssignmentQuery(
    ProductAssignment.findOne(filter),
  );
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  res.json(assignment);
});

export const acceptAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "Assigned") {
    res.status(400);
    throw new Error("Only assigned work can be accepted");
  }

  const { startDate, estimatedCompletionDate } = req.body;
  if (!startDate || !estimatedCompletionDate) {
    res.status(400);
    throw new Error(
      "Start date and estimated completion date are required to accept",
    );
  }

  const start = new Date(startDate);
  const estimated = new Date(estimatedCompletionDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(estimated.getTime())) {
    res.status(400);
    throw new Error("Invalid start or estimated completion date");
  }
  if (estimated < start) {
    res.status(400);
    throw new Error("Estimated completion must be on or after the start date");
  }

  assignment.startDate = start;
  assignment.estimatedCompletionDate = estimated;
  assignment.status = "Accepted";
  assignment.acceptedAt = new Date();
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const negotiateAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "Assigned") {
    res.status(400);
    throw new Error("Price can only be discussed before accepting");
  }

  const message = String(req.body.message || "").trim();
  if (!message) {
    res.status(400);
    throw new Error("A message to the admin is required");
  }

  let proposedPay = null;
  if (
    req.body.proposedPay !== undefined &&
    req.body.proposedPay !== null &&
    req.body.proposedPay !== ""
  ) {
    proposedPay = parsePayAmount(req.body.proposedPay);
    if (proposedPay === null) {
      res.status(400);
      throw new Error("Proposed pay must be a valid amount");
    }
  }

  assignment.priceMessages.push({
    role: "artisan",
    user: req.auth.userId,
    message,
    proposedPay,
  });
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const replyAssignmentPrice = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "Assigned") {
    res.status(400);
    throw new Error("Price can only be updated while the assignment is pending");
  }

  const message = String(req.body.message || "").trim();
  if (!message) {
    res.status(400);
    throw new Error("A reply message is required");
  }

  let offeredPay = assignment.offeredPay;
  if (
    req.body.offeredPay !== undefined &&
    req.body.offeredPay !== null &&
    req.body.offeredPay !== ""
  ) {
    const payAmount = parsePayAmount(req.body.offeredPay);
    if (payAmount === null) {
      res.status(400);
      throw new Error("Offered pay must be a valid amount");
    }
    offeredPay = payAmount;
    assignment.offeredPay = payAmount;
  }

  assignment.priceMessages.push({
    role: "admin",
    user: req.auth.userId,
    message,
    proposedPay: offeredPay,
  });
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const rejectAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "Assigned") {
    res.status(400);
    throw new Error("Only pending assignments can be rejected");
  }

  const reason = String(req.body.reason || "").trim();
  if (!reason) {
    res.status(400);
    throw new Error("A rejection reason is required");
  }

  assignment.status = "Rejected";
  assignment.rejectionReason = reason;
  assignment.rejectedAt = new Date();
  assignment.priceMessages.push({
    role: "artisan",
    user: req.auth.userId,
    message: `Rejected: ${reason}`,
    proposedPay: null,
  });
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const startAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "Accepted") {
    res.status(400);
    throw new Error("Accept the assignment before starting work");
  }
  assignment.status = "In Progress";
  assignment.startedAt = new Date();
  if (!assignment.startDate) assignment.startDate = new Date();
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const completeAssignment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "In Progress") {
    res.status(400);
    throw new Error("Start work before marking the assignment complete");
  }

  const { completionNotes, materialsUsed, hours, minutes } = req.body;
  if (!completionNotes?.trim()) {
    res.status(400);
    throw new Error("Completion notes are required");
  }

  const photos = mapUploadedFiles(req.files);
  if (!photos.length) {
    res.status(400);
    throw new Error("Please upload at least one completion photo");
  }

  const h = Math.max(0, parseInt(hours, 10) || 0);
  const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
  const timeSpent = `${h}h ${m}m`;

  assignment.status = "In Transit";
  assignment.completionNotes = completionNotes.trim();
  assignment.materialsUsed = materialsUsed || "";
  assignment.timeSpent = timeSpent;
  assignment.completionPhotos = [
    ...(assignment.completionPhotos || []),
    ...photos,
  ];
  assignment.completedAt = new Date();
  await assignment.save();
  await populateAssignmentDoc(assignment);

  // Record each completed assignment as a production occurrence
  const productRef = assignment.product?._id || assignment.product;
  const product = productRef ? await Product.findById(productRef) : null;

  const alreadyLogged = await Production.findOne({
    assignment: assignment._id,
    organization: req.auth.organizationId,
  });

  if (!alreadyLogged) {
    await Production.create({
      productName: product?.name || "Assigned product",
      category: assignment.assignmentType || "Assignment",
      quantity: String(assignment.quantity || 1),
      unit: product?.unit || "pcs",
      materials:
        materialsUsed ||
        (assignment.requiredMaterials || []).join(", ") ||
        "",
      cost: Number(product?.price) || 0,
      date: assignment.completedAt,
      notes: [
        `Assignment ${assignment.assignmentNumber}`,
        completionNotes.trim(),
        `Time spent: ${timeSpent}`,
      ]
        .filter(Boolean)
        .join("\n"),
      image: photos[0]?.url || "",
      organization: req.auth.organizationId,
      createdBy: req.auth.userId,
      product: product?._id || null,
      assignment: assignment._id,
      artisan: req.auth.userId,
      source: "assignment",
    });
  }

  res.json(assignment);
});

export const listMyAssignedProducts = asyncHandler(async (req, res) => {
  if (!req.auth.organizationId) return res.json([]);
  const assignments = await ProductAssignment.find({
    user: req.auth.userId,
    organization: req.auth.organizationId,
  }).populate("product");
  res.json(assignments.map((a) => a.product).filter(Boolean));
});

const paymentPopulate = [
  {
    path: "assignment",
    populate: [
      { path: "product", select: "name unit image" },
      { path: "user", select: "name email" },
    ],
  },
  { path: "artisan", select: "name email" },
  { path: "requestedBy", select: "name email" },
  { path: "sentBy", select: "name email" },
];

const populatePaymentQuery = (query) => query.populate(paymentPopulate);

const populatePaymentDoc = async (doc) => {
  await doc.populate(paymentPopulate);
  return doc;
};

const parseAmount = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) return null;
  return amount;
};

const getReceivedTotals = async (assignmentId) => {
  const received = await AssignmentPayment.find({
    assignment: assignmentId,
    status: "Received",
  });
  const advance = received
    .filter((p) => p.type === "advance")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const finalPay = received
    .filter((p) => p.type === "final")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return { advance, finalPay, total: advance + finalPay };
};

export const confirmDelivery = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (assignment.status !== "In Transit") {
    res.status(400);
    throw new Error("Only in-transit work can be confirmed as received");
  }

  assignment.status = "Completed";
  assignment.productReceivedAt = new Date();
  assignment.productReceivedBy = req.auth.userId;
  await assignment.save();
  await populateAssignmentDoc(assignment);
  res.json(assignment);
});

export const sendAssignmentPayment = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (["Cancelled", "Rejected", "Assigned"].includes(assignment.status)) {
    res.status(400);
    throw new Error("Payments can only be sent for accepted work");
  }

  const type = req.body.type === "final" ? "final" : "advance";
  const amount = parseAmount(req.body.amount);
  if (amount === null || amount <= 0) {
    res.status(400);
    throw new Error("A valid payment amount is required");
  }

  if (type === "final") {
    const existingFinal = await AssignmentPayment.findOne({
      assignment: assignment._id,
      type: "final",
      status: { $in: ["Pending", "Awaiting Confirmation", "Received"] },
    });
    if (existingFinal) {
      res.status(400);
      throw new Error("A final payment already exists for this assignment");
    }
  }

  const payment = await AssignmentPayment.create({
    assignment: assignment._id,
    organization: req.auth.organizationId,
    artisan: assignment.user,
    type,
    amount,
    status: "Awaiting Confirmation",
    note: String(req.body.note || "").trim(),
    sentBy: req.auth.userId,
    sentAt: new Date(),
  });

  await populatePaymentDoc(payment);
  res.status(201).json(payment);
});

export const requestAdvance = asyncHandler(async (req, res) => {
  const assignment = await ProductAssignment.findOne({
    _id: req.params.id,
    user: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (
    ["Cancelled", "Rejected", "Assigned", "Completed"].includes(
      assignment.status,
    )
  ) {
    res.status(400);
    throw new Error("Advance can only be requested on active assignments");
  }

  const amount = parseAmount(req.body.amount);
  if (amount === null || amount <= 0) {
    res.status(400);
    throw new Error("A valid advance amount is required");
  }

  const payment = await AssignmentPayment.create({
    assignment: assignment._id,
    organization: req.auth.organizationId,
    artisan: req.auth.userId,
    type: "advance",
    amount,
    status: "Pending",
    note: String(req.body.note || "").trim(),
    requestedBy: req.auth.userId,
  });

  await populatePaymentDoc(payment);
  res.status(201).json(payment);
});

export const approveAdvanceRequest = asyncHandler(async (req, res) => {
  const payment = await AssignmentPayment.findOne({
    _id: req.params.paymentId,
    organization: req.auth.organizationId,
  });
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }
  if (payment.status !== "Pending") {
    res.status(400);
    throw new Error("Only pending advance requests can be approved and sent");
  }

  if (
    req.body.amount !== undefined &&
    req.body.amount !== null &&
    req.body.amount !== ""
  ) {
    const amount = parseAmount(req.body.amount);
    if (amount === null || amount <= 0) {
      res.status(400);
      throw new Error("A valid payment amount is required");
    }
    payment.amount = amount;
  }

  if (req.body.note !== undefined) {
    payment.note = String(req.body.note || "").trim();
  }

  payment.status = "Awaiting Confirmation";
  payment.sentBy = req.auth.userId;
  payment.sentAt = new Date();
  await payment.save();
  await populatePaymentDoc(payment);
  res.json(payment);
});

export const confirmAssignmentPayment = asyncHandler(async (req, res) => {
  const payment = await AssignmentPayment.findOne({
    _id: req.params.paymentId,
    artisan: req.auth.userId,
    organization: req.auth.organizationId,
  });
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }
  if (payment.status !== "Awaiting Confirmation") {
    res.status(400);
    throw new Error("Only payments awaiting confirmation can be confirmed");
  }

  payment.status = "Received";
  payment.confirmedAt = new Date();
  await payment.save();
  await populatePaymentDoc(payment);
  res.json(payment);
});

export const listAssignmentPayments = asyncHandler(async (req, res) => {
  const payments = await populatePaymentQuery(
    AssignmentPayment.find({
      organization: req.auth.organizationId,
    }).sort({ createdAt: -1 }),
  );
  res.json(payments);
});

export const listMyAssignmentPayments = asyncHandler(async (req, res) => {
  if (!req.auth.organizationId) return res.json([]);
  const payments = await populatePaymentQuery(
    AssignmentPayment.find({
      artisan: req.auth.userId,
      organization: req.auth.organizationId,
    }).sort({ createdAt: -1 }),
  );
  res.json(payments);
});

export const listAssignmentPaymentsForAssignment = asyncHandler(
  async (req, res) => {
    const filter = {
      _id: req.params.id,
      organization: req.auth.organizationId,
    };
    if (!req.auth.isOrgAdmin) {
      filter.user = req.auth.userId;
    }
    const assignment = await ProductAssignment.findOne(filter);
    if (!assignment) {
      res.status(404);
      throw new Error("Assignment not found");
    }

    const payments = await populatePaymentQuery(
      AssignmentPayment.find({ assignment: assignment._id }).sort({
        createdAt: -1,
      }),
    );
    const totals = await getReceivedTotals(assignment._id);
    res.json({
      payments,
      totals,
      offeredPay: assignment.offeredPay,
      remaining: Math.max(0, Number(assignment.offeredPay || 0) - totals.total),
    });
  },
);
