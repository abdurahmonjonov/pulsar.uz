export const MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"
];

export const money = (value = 0) =>
  new Intl.NumberFormat("uz-UZ").format(Number(value || 0)) + " so'm";

export const monthName = (m) => MONTHS[Number(m) - 1] || "-";

export const todayYear = () => new Date().getFullYear();
export const todayMonth = () => new Date().getMonth() + 1;

export const paymentStatus = (paid, due) => {
  const p = Number(paid || 0);
  const d = Number(due || 0);
  if (p >= d && d > 0) return "paid";
  if (p > 0) return "partial";
  return "unpaid";
};

export const statusLabel = {
  paid: "To'langan",
  partial: "Qisman",
  unpaid: "To'lanmagan"
};

export const cls = (...items) => items.filter(Boolean).join(" ");