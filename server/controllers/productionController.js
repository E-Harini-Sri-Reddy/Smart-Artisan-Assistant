import Production from "../models/Production.js";
import Payment from "../models/Payment.js";

/**
 * GET ALL PRODUCTIONS
 */
export const getProductions = async (req, res) => {
  try {
    const data = await Production.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * CREATE
 */
export const createProduction = async (req, res) => {
  try {
    const item = await Production.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * UPDATE
 */
export const updateProduction = async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE
 */
export const deleteProduction = async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DASHBOARD SUMMARY (REAL ANALYTICS)
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // Fetch all records
    const productions = await Production.find();
    const payments = await Payment.find({ status: "Completed" });

    // 1. Core Financials
    const totalItems = productions.length;
    const totalCost = productions.reduce(
      (acc, item) => acc + (item.cost || 0),
      0,
    );
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const actualProfit = totalRevenue - totalCost;

    /**
     * PIE DATA (By Category)
     */
    const categoryMap = {};
    productions.forEach((p) => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });

    const pieData = Object.keys(categoryMap).map((k) => ({
      name: k,
      value: categoryMap[k],
    }));

    const now = new Date();

    /**
     * WEEKLY (LAST 7 DAYS)
     */
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyMap = {};

    productions.forEach((p) => {
      const d = new Date(p.date);
      const diff = (now - d) / (1000 * 60 * 60 * 24);

      if (diff <= 6) {
        const day = weekDays[d.getDay()];
        weeklyMap[day] = (weeklyMap[day] || 0) + (p.cost || 0);
      }
    });

    const weeklyData = weekDays.map((d) => ({
      name: d,
      earnings: weeklyMap[d] || 0,
    }));

    /**
     * THIS MONTH (DAILY BREAKDOWN)
     */
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthlyMap = Array(daysInMonth).fill(0);

    productions.forEach((p) => {
      const d = new Date(p.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate() - 1;
        monthlyMap[day] += p.cost || 0;
      }
    });

    const monthlyData = monthlyMap.map((val, idx) => ({
      name: `${idx + 1}`,
      earnings: val,
    }));

    /**
     * THIS YEAR (MONTHLY BREAKDOWN)
     */
    const yearMap = Array(12).fill(0);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    productions.forEach((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() === currentYear) {
        yearMap[d.getMonth()] += p.cost || 0;
      }
    });

    const yearlyData = monthNames.map((m, i) => ({
      name: m,
      earnings: yearMap[i],
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
