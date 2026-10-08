import Payment from "../models/Payment.js";
import { organizationResourceFilter } from "../utils/tenantScope.js";

export const getReports = async (req, res) => {
  try {
    if (!req.auth?.isOrgAdmin || !req.auth.organizationId) {
      return res
        .status(403)
        .json({ message: "Organization admin access required" });
    }

    const payments = await Payment.find(organizationResourceFilter(req.auth));

    const totalEarnings = payments.reduce(
      (acc, item) => acc + (item.amount || 0),
      0,
    );

    const totalProduction = payments.length;
    const totalExpenses = Math.round(totalEarnings * 0.35);
    const netProfit = totalEarnings - totalExpenses;

    const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthLabels = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const weekMap = {};
    const monthMap = {};
    const yearMap = {};

    payments.forEach((p) => {
      const d = new Date(p.paymentDate);

      const day = weekLabels[d.getDay()];
      weekMap[day] = (weekMap[day] || 0) + (p.amount || 0);

      const month = monthLabels[d.getMonth()];
      monthMap[month] = (monthMap[month] || 0) + (p.amount || 0);

      const year = d.getFullYear();
      yearMap[year] = (yearMap[year] || 0) + (p.amount || 0);
    });

    const weeklyData = weekLabels.map((l) => ({
      label: l,
      value: weekMap[l] || 0,
    }));

    const monthlyData = monthLabels.map((l) => ({
      label: l,
      value: monthMap[l] || 0,
    }));

    const yearlyData = Object.keys(yearMap).map((y) => ({
      label: y,
      value: yearMap[y],
    }));

    const productMap = {};

    payments.forEach((p) => {
      productMap[p.product] = (productMap[p.product] || 0) + (p.amount || 0);
    });

    const topProducts = Object.entries(productMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const max = Math.max(...topProducts.map((p) => p.value), 1);

    const topProductsWithProgress = topProducts.map((p) => ({
      name: p.name,
      value: `₹${p.value}`,
      progress: Math.round((p.value / max) * 100),
    }));

    res.json({
      totalEarnings,
      totalProduction,
      totalExpenses,
      netProfit,
      weeklyData,
      monthlyData,
      yearlyData,
      topProducts: topProductsWithProgress,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
