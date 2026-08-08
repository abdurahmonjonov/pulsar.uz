import { supabase } from "./supabase";

export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

export async function getGroups() {
  const { data, error } = await supabase.from("course_groups").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function getYears() {
  const { data, error } = await supabase.from("academic_years").select("*").order("year", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("*, course_groups(id,name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*, students(id,first_name,last_name,monthly_fee,course_groups(id,name))")
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getHomework() {
  const { data, error } = await supabase
    .from("homework")
    .select("*, students(id,first_name,last_name,course_groups(id,name))")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("task_number");
  if (error) throw error;
  return data || [];
}

export async function upsertPayment(student, year, month, paidAmount, additionalAmount = 0) {
  const base = Number(student.monthly_fee || 0);
  const paid = Number(paidAmount || 0);
  const due = base + Number(additionalAmount || 0);
  const status = paid >= due && due > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
  const payload = {
    student_id: student.id, year, month,
    base_amount: base, additional_amount: Number(additionalAmount || 0),
    paid_amount: paid, status, paid_at: paid > 0 ? new Date().toISOString() : null
  };
  const { data, error } = await supabase
    .from("payments").upsert(payload, { onConflict: "student_id,year,month" }).select().single();
  if (error) throw error;
  return data;
}

export async function ensurePaymentPenalty(student, year, month, penaltyAmount) {
  const { data: existing, error: readError } = await supabase
    .from("payments").select("*").eq("student_id", student.id).eq("year", year).eq("month", month).maybeSingle();
  if (readError) throw readError;
  const paid = Number(existing?.paid_amount || 0);
  return upsertPayment(student, year, month, paid, penaltyAmount);
}