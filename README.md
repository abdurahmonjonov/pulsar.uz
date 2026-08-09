# Fizika Kursi Admin

React + Vite + Supabase asosidagi o'quvchilar, to'lovlar va uy vazifalarini boshqarish paneli.

## Ishga tushirish

1. Supabase'da yangi project oching.
2. `supabase/schema.sql` faylini Supabase SQL Editor'da ishga tushiring.
3. Supabase Authentication > Users bo'limida admin email/parol yarating.
4. `.env.example` ni `.env` qilib nusxalang va Supabase URL + anon key kiriting.
5. Terminalda:
   ```bash
   npm install
   npm run dev
   ```
6. Brauzerda Vite ko'rsatgan manzilni oching va admin akkaunt bilan kiring.

## Muhim

- Ilova admin login orqali himoyalangan.
- Ma'lumotlar Supabase PostgreSQL'da saqlanadi.
- 3 ta to'liq bajarilmagan vazifa bo'lsa, o'quvchi avtomatik ravishda "Vazifasi bajarilmaganlar" sahifasida chiqadi.
- Sozlamadagi jarima summasi shu oy uchun jami to'lovni hisoblashda ishlatiladi.
- 12 oy va bir nechta yillarni boshqarish mumkin.
- Interfeys to'liq o'zbek tilida.
