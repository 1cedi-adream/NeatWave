import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, UserRound } from "lucide-react";
import { useSessionStore } from "../../../store/sessionStore";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const updateUser = useSessionStore((state) => state.updateUser);
  const setUser = useSessionStore((state) => state.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const initials = name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  function saveProfile() {
    const cleanName = name.trim();
    if (!cleanName) return;
    updateUser({ name: cleanName });
    setName(cleanName);
    toast.success("Profile details saved.");
  }

  function signOut() {
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-full px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Your profile</h1>
          <p className="mt-2 text-base text-gray-600">Manage the details used for your shop account.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-5 border-b border-gray-200 bg-gray-50/70 px-6 py-7 sm:flex-row sm:items-center sm:px-8">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-900" aria-hidden="true">{initials}</div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold text-gray-900">{name || "Staff member"}</h2>
              <p className="mt-1 text-base text-gray-600">{user?.role ?? "Staff"} · Fresh &amp; Fold</p>
            </div>
          </div>

          <form className="px-6 py-7 sm:px-8" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-700"><UserRound size={19}/></span>
              <div><h3 className="text-lg font-semibold text-gray-900">Personal details</h3><p className="mt-0.5 text-sm text-gray-600">Demo profile details. Backend profile storage is not connected yet.</p></div>
            </div>
            <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-gray-700">Full name
                <input className="h-12 rounded-lg border border-gray-300 bg-white px-3.5 text-base text-gray-900 outline-none transition focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} required/>
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">Email or phone
                <input className="h-12 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-base text-gray-700" value={user?.identifier ?? user?.email ?? "Not provided"} readOnly aria-readonly="true"/>
              </label>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-6">
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!name.trim() || name.trim() === user?.name}><Save size={16}/> Save changes</button>
              <button className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500" type="button" onClick={signOut}><LogOut size={16}/> Sign out</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
