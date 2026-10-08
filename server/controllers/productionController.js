import Production from "../models/Production.js";
import Payment from "../models/Payment.js";
import { organizationResourceFilter } from "../utils/tenantScope.js";

/**
 * GET DASHBOARD SUMMARY DATA — organization-scoped
 */
export const getDashboardSummary = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res.status(403).json({ message: "Organization admin access required" });
    }

    const scope = organizationResourceFilter(req.auth);
    const productions = await Production.find(scope);
    const payments = await Payment.find({ ...scope, status: "Completed" });

    const totalItems = productions.length;
    const totalCost = productions.reduce(
      (acc, item) => acc + (item.cost || 0),
      0,
    );
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const actualProfit = totalRevenue - totalCost;

    const categoryMap = {};
    productions.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    const pieData = Object.keys(categoryMap).map((k) => ({
      name: k,
      value: categoryMap[k],
    }));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = {};
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      if (diff <= 6) {
        const day = weekDays[d.getDay()];
        weeklyMap[day] = (weeklyMap[day] || 0) + (p.amount || 0);
      }
    });
    const weeklyData = weekDays.map((d) => ({
      name: d,
      profit: weeklyMap[d] || 0,
    }));

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyMap = Array(daysInMonth).fill(0);
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthlyMap[d.getDate() - 1] += p.amount || 0;
      }
    });
    const monthlyData = monthlyMap.map((val, idx) => ({
      name: `${idx + 1}`,
      profit: val,
    }));

    const yearMap = Array(12).fill(0);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    payments.forEach((p) => {
      const d = new Date(p.paymentDate);
      if (d.getFullYear() === currentYear) {
        yearMap[d.getMonth()] += p.amount || 0;
      }
    });
    const yearlyData = monthNames.map((m, i) => ({
      name: m,
      profit: yearMap[i],
    }));

    res.json({
      totalItems,
      totalCost,
      totalRevenue,
      actualProfit,
      pieData,
      weeklyData,
      monthlyData,
      yearlyData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductions = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res.status(403).json({ message: "Organization admin access required" });
    }

    const data = await Production.find(
      organizationResourceFilter(req.auth),
    ).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProduction = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res.status(403).json({ message: "Organization admin access required" });
    }

    const {
      productName,
      category,
      quantity,
      unit,
      materials,
      cost,
      date,
      notes,
      image,
    } = req.body;

    const item = await Production.create({
      productName,
      category,
      quantity,
      unit,
      materials,
      cost,
      date,
      notes,
      image,
      organization: req.auth.organizationId,
      createdBy: req.auth.userId,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProduction = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res.status(403).json({ message: "Organization admin access required" });
    }

    const allowed = [
      "productName",
      "category",
      "quantity",
      "unit",
      "materials",
      "cost",
      "date",
      "notes",
      "image",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Production.findOneAndUpdate(
      { _id: req.params.id, organization: req.auth.organizationId },
      updates,
      { returnDocument: "after", runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteProduction = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res.status(403).json({ message: "Organization admin access required" });
    }

    const { id } = req.params;
    const result = await Production.findOneAndDelete({
      _id: id,
      organization: req.auth.organizationId,
    });

    if (!result) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
