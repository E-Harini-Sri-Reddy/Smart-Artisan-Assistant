import Production from "../models/Production.js";

// GET ALL
export const getProductions = async (req, res) => {
  const data = await Production.find().sort({ createdAt: -1 });
  res.json(data);
};

// CREATE
export const createProduction = async (req, res) => {
  const item = await Production.create(req.body);
  res.status(201).json(item);
};

// UPDATE (FULL EDIT SUPPORT)
export const updateProduction = async (req, res) => {
  const updated = await Production.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
};

// DELETE
export const deleteProduction = async (req, res) => {
  await Production.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
};
