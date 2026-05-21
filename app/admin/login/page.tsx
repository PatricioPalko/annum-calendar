import { AdminLoginForm } from "./admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF7F4] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EAD6DE] bg-white p-6 shadow-xl shadow-[#3E0F28]/10">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#FC5A61]">
          Admin
        </p>

        <h1 className="mt-2 font-heading text-3xl font-bold text-[#3E0F28]">
          Prihlásenie
        </h1>

        <AdminLoginForm />
      </div>
    </main>
  );
}
