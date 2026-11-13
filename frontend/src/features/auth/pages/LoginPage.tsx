import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, WashingMachine } from 'lucide-react'
import { useSessionStore } from '../../../store/sessionStore'
import { requestPasswordReset, signIn } from '../services/authService'
import { toast } from 'sonner'

function validIdentifier(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^\+?[\d\s().-]{7,}$/.test(value)
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useSessionStore(state => state.setUser)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validIdentifier(identifier)) { toast.error('Enter a valid email address or phone number.'); return }
    if (mode === 'login' && password.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    setBusy(true)
    try {
      if (mode === 'reset') {
        await requestPasswordReset(identifier)
        toast.success('If that account exists, reset instructions will be sent.')
      } else {
        const user = await signIn(identifier, password)
        setUser({ id: user.id, name: user.name, role: user.role, email: user.email, identifier: identifier.trim() }, remember)
        navigate('/', { replace: true })
      }
    } catch {
      toast.error(mode === 'reset' ? 'Password reset is unavailable right now. Try again later.' : 'Sign in failed. Check your details and try again.')
    } finally { setBusy(false) }
  }

  return <main className="grid min-h-screen place-items-stretch bg-white p-0">
    <div className="grid min-h-screen w-full grid-cols-1 bg-white lg:grid-cols-[.52fr_1fr]">
      <aside className="relative flex min-h-[205px] flex-col overflow-hidden bg-[#292522] p-5 text-white sm:p-7 lg:min-h-screen lg:p-8">
        <img className="absolute inset-0 h-full w-full object-cover object-[50%_50%]" src="/images/authImageL.jpg" alt="Laundry shop team member holding fresh towels"/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75"/>
        <div className="relative flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/15"><WashingMachine size={19}/></span><span className="font-display text-lg font-bold tracking-tight">Fresh & Fold</span></div>
        <div className="relative mt-auto max-w-md pt-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-white/80">Downtown shop</p><h1 className="font-display text-[clamp(25px,3vw,38px)] font-semibold leading-[1.14] tracking-tight">From drop-off to pickup.</h1><p className="mt-3 hidden max-w-sm text-base leading-6 text-white/85 sm:block">Orders, customers, and shop activity in one place.</p></div>
      </aside>
      <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="w-full max-w-[390px]">
          {mode === 'reset' && <button className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-800" onClick={() => setMode('login')}><ArrowLeft size={16}/> Back to sign in</button>}
          <div className="mb-7 text-center"><h2 className="font-display text-[27px] font-bold tracking-tight text-gray-900">{mode === 'login' ? 'Welcome back' : 'Reset your password'}</h2><p className="mt-2 text-sm leading-6 text-gray-600">{mode === 'login' ? 'Sign in to your Fresh & Fold account.' : 'Enter your email or phone to receive reset instructions.'}</p></div>
          <form className="grid gap-4" onSubmit={submit} noValidate>
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">Email or phone<input className="h-[50px] w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10" type="text" autoComplete="username" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="Email address or phone number" required/></label>
            {mode === 'login' && <label className="grid gap-1.5 text-sm font-medium text-gray-700">Password<span className="relative"><input className="h-[50px] w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-700/10" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" required/><button className="absolute inset-y-0 right-2 grid w-9 place-items-center text-gray-400 hover:text-gray-700" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>}
            {mode === 'login' && <div className="flex items-center justify-between"><label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600"><input className="h-4 w-4 accent-emerald-800" type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/>Remember me</label><button type="button" className="text-sm font-semibold text-emerald-800 hover:text-emerald-950" onClick={() => setMode('reset')}>Forgot password?</button></div>}
            <button className="mt-1 flex h-[50px] items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-70" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? <>Sign in <ArrowRight size={16}/></> : 'Send reset instructions'}</button>
          </form>
          <p className="mt-6 text-center text-sm leading-6 text-gray-600">Staff access? Ask your shop manager.</p>
        </div>
      </section>
    </div>
  </main>
}
