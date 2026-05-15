import Production from "../models/Production.js";
import Payment from "../models/Payment.js";

/**
 * GET DASHBOARD SUMMARY DATA
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const productions = await Production.find();
    const payments = await Payment.find({ status: "Completed" });

    // 1. Financial Totals
    const totalItems = productions.length;
    const totalCost = productions.reduce(
      (acc, item) => acc + (item.cost || 0),
      0,
    );
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const actualProfit = totalRevenue - totalCost;

    // 2. Pie Chart Data (Category Distribution)
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

    /**
     * WEEKLY REVENUE TREND
     */
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

    /**
     * MONTHLY REVENUE TREND
     */
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

    /**
     * YEARLY REVENUE TREND
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

/**
 * CRUD OPERATIONS
 */
export const getProductions = async (req, res) => {
  try {
    const data = await Production.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProduction = async (req, res) => {
  try {
    const item = await Production.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProduction = async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    const { id } = req.params;
    console.log("Attempting to delete ID:", id);

    // Try deleting as a standard Mongoose ID first,
    // then fallback to a string match if that fails.
    let result = await Production.findByIdAndDelete(id);

    if (!result) {
      // Manual fallback for imported 'String' IDs
      result = await Production.deleteOne({ _id: id });
    }

    if (result.deletedCount === 0 || !result) {
      console.log("Delete failed: No record found in DB.");
      return res.status(404).json({ message: "Record not found" });
    }

    console.log("Delete successful!");
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
