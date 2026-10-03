import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { projectId, publicAnonKey } from "../utils/supabase/info"
import { supabase } from "./lib/supabase"

type Screen = "login" | "landing" | "dashboard" | "create" | "matches" | "partner" | "agreement" | "room" | "approvals" | "campaigns" | "campaign-detail" | "application" | "account"

type Role = "business" | "partner"
type Tone = "success" | "warning" | "neutral" | "danger"
const A = "/assets"
const icons = {
  dashboard: `${A}/66e1c.svg`,
  campaigns: `${A}/cea13.svg`,
  matches: `${A}/bff7d.svg`,
  rooms: `${A}/c99d7.svg`,
  governance: `${A}/1dd7a.svg`,
  analytics: `${A}/d8328.svg`,
}

const partners = [
  {
    id: "aarav",
    name: "Aarav Sharma",
    subtitle: "Skincare educator · Mumbai",
    image: `${A}/e608f.png`,
    budget: "₹70,000",
    fit: [96, 94, 91],
    why: "Strong skincare content performance and a similar target audience.",
    proof: [
      "78% target audience overlap",
      "4.2× recent ROAS",
      "98% on-time delivery",
    ],
  },
  {
    id: "isha",
    name: "Isha Mehta",
    subtitle: "Beauty & wellness · Bengaluru",
    image: `${A}/23efb.png`,
    budget: "₹58,000",
    fit: [92, 89, 90],
    why: "Her audience and content style closely match this campaign.",
    proof: [
      "73% audience overlap",
      "89% brand affinity",
      "96% on-time delivery",
    ],
  },
  {
    id: "lumen",
    name: "Studio Lumen",
    subtitle: "Creative agency · Delhi",
    image: "",
    budget: "₹65,000",
    fit: [88, 86, 93],
    why: "Reliable beauty campaign delivery with strong creative performance.",
    proof: [
      "77% cohort overlap",
      "12 relevant campaigns",
      "91% milestone reliability",
    ],
  },
]

const campaigns = [
  {
    id: "radiance",
    name: "Radiance Lab Spring Launch",
    company: "Radiance Lab",
    category: "Skincare · Instagram",
    budget: "₹55,000–₹70,000",
    fit: [94, 91, 90],
    why: "Your skincare audience and recent Reels performance fit this launch.",
    deliverables: "2 Instagram Reels · 3 Stories",
    deadline: "24 May 2025",
  },
  {
    id: "rituals",
    name: "Daily Rituals: Barrier Care",
    company: "Morrow & Co.",
    category: "Beauty · Instagram",
    budget: "₹45,000–₹60,000",
    fit: [89, 92, 84],
    why: "Your educational content style matches the campaign’s trust-led brief.",
    deliverables: "1 Instagram Reel · 4 Stories",
    deadline: "31 May 2025",
  },
  {
    id: "wellbeing",
    name: "Everyday Wellbeing",
    company: "Kind Form",
    category: "Wellness · Multi-platform",
    budget: "₹40,000–₹52,000",
    fit: [82, 86, 88],
    why: "Your audience has a strong affinity for practical wellness content.",
    deliverables: "1 Reel · 1 short video",
    deadline: "08 June 2025",
  },
]

// One shared model ranks either side of the marketplace.
const match = (fit: number[]) =>
  Math.round(fit.reduce((sum, value) => sum + value, 0) / fit.length)
const matchLabel = (score: number) =>
  score >= 92 ? "Strong Match" : score >= 86 ? "Good Match" : "Needs Review"

function downloadTextFile(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "quiet" | "danger"
  type?: "button" | "submit"
  disabled?: boolean
}) {
  return (
    <button
      className={`button ${variant}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
  readOnly = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  type?: string
  readOnly?: boolean
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return <span className={`badge ${tone}`}>{children}</span>
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`card ${className}`}>{children}</section>
}

function Heading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <header className="page-heading">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <img src={`${A}/a92b9.svg`} alt="" />
      <div>
        <strong>Mystique</strong>
        {!compact && <span>PARTNERSHIP INTELLIGENCE</span>}
      </div>
    </div>
  )
}

function Login({
  recovery = false,
  onRecoveryComplete,
}: {
  recovery?: boolean
  onRecoveryComplete?: () => void
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(
    recovery ? "reset" : "login",
  )
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(`https://${projectId}.supabase.co/auth/v1/settings`, {
      headers: { apikey: publicAnonKey },
    })
      .then((response) => response.json())
      .then((settings: { external?: { google?: boolean } }) =>
        setGoogleEnabled(Boolean(settings.external?.google)),
      )
      .catch(() => setGoogleEnabled(null))
  }, [])

  const changeMode = (nextMode: "login" | "register" | "forgot") => {
    setMode(nextMode)
    setError("")
    setMessage("")
    setVerificationPending(false)
    requestAnimationFrame(() =>
      formRef.current?.querySelector("input")?.focus(),
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")

    if (mode === "forgot") {
      if (!email.includes("@")) {
        setError("Enter the email address connected to your Mystique account.")
        return
      }
      setLoading(true)
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: window.location.origin },
      )
      setLoading(false)
      if (authError) {
        setError(authError.message)
        return
      }
      setMessage(
        "Password reset email sent. Check your inbox, spam and promotions folders.",
      )
      return
    }

    if (mode === "reset") {
      if (password.length < 8 || password !== confirmPassword) {
        setError(
          password.length < 8
            ? "Use a password of at least 8 characters."
            : "Passwords do not match.",
        )
        return
      }
      setLoading(true)
      const { error: authError } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (authError) {
        setError(authError.message)
        return
      }
      setMessage("Your password has been updated. You can now sign in.")
      await supabase.auth.signOut()
      onRecoveryComplete?.()
      return
    }

    if (!email.includes("@") || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.")
      return
    }
    if (
      mode === "register" &&
      (!fullName.trim() || password !== confirmPassword)
    ) {
      setError(
        !fullName.trim() ? "Enter your full name." : "Passwords do not match.",
      )
      return
    }

    setLoading(true)
    if (mode === "register") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      })
      setLoading(false)
      if (authError) {
        setError(
          authError.message.toLowerCase().includes("already registered")
            ? "An account with this email already exists. Sign in or reset your password."
            : authError.message,
        )
        return
      }
      if (data.user?.identities?.length === 0) {
        setError(
          "An account with this email already exists. Sign in or reset your password.",
        )
        return
      }
      if (!data.session) {
        setVerificationPending(true)
        setMessage(
          "Account created. Check your inbox and spam folder for the verification email.",
        )
        return
      }
      setMessage("Account created successfully. Preparing your workspace...")
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setVerificationPending(true)
      }
    }
  }

  const resendVerification = async () => {
    if (!email.includes("@")) {
      setError("Enter the email address you registered with.")
      return
    }
    setError("")
    setMessage("")
    setLoading(true)
    const { error: authError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setVerificationPending(true)
    setMessage(
      "Verification email resent. Check your inbox, spam and promotions folders.",
    )
  }

  const continueWithGoogle = async () => {
    setError("")
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    if (authError) {
      setLoading(false)
      setError(authError.message)
    }
  }

  return (
    <main className="login-page">
      <div className="login-orbit login-orbit-one" />
      <div className="login-orbit login-orbit-two" />
      <div className="login-brand">
        <Brand />
      </div>
      <Card className="login-card">
        {mode !== "reset" && (
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Authentication mode"
          >
            <Button
              variant={mode === "login" ? "primary" : "quiet"}
              onClick={() => changeMode("login")}
            >
              Sign in
            </Button>
            <Button
              variant={mode === "register" ? "primary" : "quiet"}
              onClick={() => changeMode("register")}
            >
              Create account
            </Button>
          </div>
        )}
        <div className="login-heading">
          <Badge>PARTNERSHIP INTELLIGENCE</Badge>
          <h1>
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Join Mystique"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Choose a new password"}
          </h1>
          <p>
            {mode === "login"
              ? "Sign in to continue to your partnerships."
              : mode === "register"
                ? "Create your account to start building better partnerships."
                : mode === "forgot"
                  ? "We’ll send a secure recovery link to your email."
                  : "Enter a new password for your Mystique account."}
          </p>
        </div>
        <form ref={formRef} className="login-form" onSubmit={submit}>
          {mode === "register" && (
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Your full name"
            />
          )}
          {mode !== "reset" && (
            <Field
              label="Work email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              type="email"
            />
          )}
          {mode !== "forgot" && (
            <Field
              label={mode === "reset" ? "New password" : "Password"}
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              type="password"
            />
          )}
          {(mode === "register" || mode === "reset") && (
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              type="password"
            />
          )}
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="login-success" role="status">
              {message}
            </div>
          )}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send recovery email"
                    : "Update password"}
          </Button>
        </form>
        {mode === "login" && (
          <div className="forgot-action">
            <Button variant="quiet" onClick={() => changeMode("forgot")}>
              Forgot password?
            </Button>
          </div>
        )}
        {mode === "forgot" && (
          <div className="forgot-action">
            <Button variant="quiet" onClick={() => changeMode("login")}>
              Back to sign in
            </Button>
          </div>
        )}
        {verificationPending && (
          <div className="verification-help">
            <p>
              Still no email? Delivery can take a few minutes. Confirm the
              address above, then request a new link.
            </p>
            <Button
              variant="secondary"
              onClick={resendVerification}
              disabled={loading}
            >
              Resend verification email
            </Button>
          </div>
        )}
        {mode !== "reset" && mode !== "forgot" && (
          <>
            <div className="login-divider">
              <span>or continue with</span>
            </div>
            <div className="google-setup">
              <Button
                variant="secondary"
                onClick={continueWithGoogle}
                disabled={loading || googleEnabled === false}
              >
                {googleEnabled === false
                  ? "Google sign-in unavailable"
                  : "Continue with Google"}
              </Button>
              {googleEnabled === false && (
                <small>
                  Enable Google under Supabase Authentication providers.
                </small>
              )}
            </div>
          </>
        )}
        <p className="login-terms">
          By continuing, you agree to Mystique’s Terms and Privacy Policy.
        </p>
      </Card>
      <div className="login-caption">
        Intelligence proposes. You retain the final word.
      </div>
    </main>
  )
}

function Landing({ onChoose }: { onChoose: (role: Role) => void }) {
  return (
    <main className="landing">
      <div className="landing-orbit orbit-one" />
      <div className="landing-orbit orbit-two" />
      <header className="landing-nav">
        <Brand />
        <Badge>Campaign Agent ready</Badge>
      </header>
      <div className="landing-copy">
        <div className="eyebrow light">PARTNERSHIP INTELLIGENCE</div>
        <h1>
          Partnerships with
          <br />
          undeniable resonance.
        </h1>
        <p>
          AI-powered partnership intelligence that helps every side find the
          right fit, agree clearly and work better together.
        </p>
      </div>
      <div className="role-grid">
        <Card className="role-card">
          <Badge tone="success">For businesses</Badge>
          <h2>Start a Campaign</h2>
          <p>
            Build a clear brief and find creators or agencies who genuinely fit.
          </p>
          <Button onClick={() => onChoose("business")}>
            Start a Campaign →
          </Button>
        </Card>
        <Card className="role-card">
          <Badge>For creators & agencies</Badge>
          <h2>Join a Campaign</h2>
          <p>
            Discover campaigns that match your audience, work and availability.
          </p>
          <Button onClick={() => onChoose("partner")}>Find campaigns →</Button>
        </Card>
      </div>
      <footer className="landing-footer">
        Mystique proposes. You retain the final word.
      </footer>
    </main>
  )
}

function Shell({
  screen,
  role,
  go,
  children,
}: {
  screen: Screen
  role: Role
  go: (screen: Screen) => void
  children: ReactNode
}) {
  const [search, setSearch] = useState("")
  const businessNav: [Screen, string, keyof typeof icons][] = [
    ["dashboard", "Dashboard", "dashboard"],
    ["create", "Campaigns", "campaigns"],
    ["matches", "AI Matches", "matches"],
    ["room", "Partnership Rooms", "rooms"],
    ["approvals", "Governance", "governance"],
    ["account", "Account", "governance"],
  ]
  const partnerNav: [Screen, string, keyof typeof icons][] = [
    ["campaigns", "Campaigns for you", "matches"],
    ["application", "Applications", "campaigns"],
    ["room", "Partnership Rooms", "rooms"],
    ["account", "Account", "governance"],
  ]
  const nav = role === "business" ? businessNav : partnerNav
  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const query = search.trim().toLowerCase()
    if (!query) return
    if (
      query.includes("account") ||
      query.includes("password") ||
      query.includes("setting")
    )
      go("account")
    else if (query.includes("approval") || query.includes("governance"))
      go(role === "business" ? "approvals" : "room")
    else if (
      query.includes("agreement") ||
      query.includes("room") ||
      query.includes("deliverable")
    )
      go("room")
    else if (
      query.includes("partner") ||
      query.includes("creator") ||
      query.includes("match")
    )
      go(role === "business" ? "matches" : "campaigns")
    else if (query.includes("campaign"))
      go(role === "business" ? "create" : "campaigns")
    else go(role === "business" ? "dashboard" : "campaigns")
    setSearch("")
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <Brand />
          <div className="nav-label">CORE MODULES</div>
          <nav>
            {nav.map(([target, label, icon]) => (
              <button
                key={target}
                className={screen === target ? "active" : ""}
                onClick={() => go(target)}
              >
                <img src={icons[icon]} alt="" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="workspace">
            <span>YOUR WORKSPACE</span>
            <strong>
              {role === "business" ? "GlowSkin Global" : "Aarav Sharma"}
            </strong>
            <small>
              {role === "business"
                ? "Enterprise · India region"
                : "Creator · Skincare"}
            </small>
          </div>
        </div>
        <div>
          <div className="agent-note">
            Mystique constellation
            <br />
            <span>
              Intelligence proposes.
              <br />
              You retain the final word.
            </span>
          </div>
          <button className="profile" onClick={() => go("account")}>
            <i>AC</i>
            <span>
              Account settings<small>Profile & security</small>
            </span>
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <form className="search" onSubmit={submitSearch}>
            <img src={`${A}/98894.svg`} alt="" />
            <input
              aria-label="Search Mystique"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaigns, partners, agreements..."
            />
          </form>
          <div className="top-actions">
            <Badge>Campaign Agent ready</Badge>
            {role === "business" && (
              <Button onClick={() => go("create")}>+ New Campaign</Button>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}

function Dashboard({ go }: { go: (screen: Screen) => void }) {
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="PORTFOLIO OVERVIEW"
          title="Good morning, Alex"
          subtitle="Your partnerships are moving forward. Two items need your attention."
        />
        <Button onClick={() => go("create")}>+ New Campaign</Button>
      </div>
      <div className="stat-grid">
        {[
          ["ACTIVE CAMPAIGNS", "3", "1 launching this week"],
          ["RECOMMENDED PARTNERS", "12", "3 strong matches"],
          ["ACTIVE PARTNERSHIPS", "5", "All on schedule"],
          ["PENDING APPROVALS", "2", "Your review needed"],
        ].map(([label, value, note], index) => (
          <Card key={label} className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <small className={index === 3 ? "amber" : "green"}>{note}</small>
          </Card>
        ))}
      </div>
      <div className="split">
        <Card>
          <div className="card-title">
            <div>
              <h2>Active campaigns</h2>
              <p>Simple progress across your current work.</p>
            </div>
            <Button variant="quiet" onClick={() => go("create")}>
              View all
            </Button>
          </div>
          {[
            ["GlowSkin Barrier Restore", "Matching partners", "72%"],
            ["Summer Rituals", "Active", "56%"],
            ["Everyday SPF", "Approval needed", "84%"],
          ].map(([name, status, progress]) => (
            <div className="campaign-row" key={name}>
              <div>
                <strong>{name}</strong>
                <Badge
                  tone={status === "Approval needed" ? "warning" : "success"}
                >
                  {status}
                </Badge>
              </div>
              <div className="progress">
                <i style={{ width: progress }} />
              </div>
              <span>{progress}</span>
            </div>
          ))}
        </Card>
        <Card className="assistant-card">
          <div className="spark">
            <img src={`${A}/bff7d.svg`} alt="" />
          </div>
          <Badge>WHAT TO DO NEXT</Badge>
          <h2>Review your strongest matches</h2>
          <p>
            Three partners fit the GlowSkin launch. Aarav leads on audience,
            recent performance and availability.
          </p>
          <Button onClick={() => go("matches")}>Review partners →</Button>
        </Card>
      </div>
      <Card>
        <div className="card-title">
          <div>
            <h2>Active partnerships</h2>
            <p>Deadlines, approvals and payments at a glance.</p>
          </div>
        </div>
        <div className="partnership-grid">
          {["Aarav Sharma", "Isha Mehta", "Studio Lumen"].map((name, index) => (
            <div className="mini-partner" key={name}>
              <div className="avatar">{name.slice(0, 2)}</div>
              <div>
                <strong>{name}</strong>
                <small>
                  {index === 2 ? "Brief review" : "Content in progress"}
                </small>
              </div>
              <Badge tone={index === 2 ? "warning" : "success"}>
                {index === 2 ? "Approval Needed" : "Active"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function CreateCampaign({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "GlowSkin Skincare Launch",
    product: "Barrier Restore Serum",
    goal: "Sales & conversion",
    budget: "₹75,000",
    audience: "Women 22–34 interested in skincare and wellness",
    location: "India",
    platforms: "Instagram",
    requirements: "2 Reels, 3 Stories, tracked product link and final report",
  })
  const fields = [
    <>
      <Field
        label="Campaign name"
        value={form.name}
        onChange={(name) => setForm({ ...form, name })}
      />
      <Field
        label="Product or service"
        value={form.product}
        onChange={(product) => setForm({ ...form, product })}
      />
    </>,
    <>
      <SelectField
        label="Primary goal"
        value={form.goal}
        options={[
          "Sales & conversion",
          "Brand awareness",
          "Engagement",
          "App installs",
        ]}
        onChange={(goal) => setForm({ ...form, goal })}
      />
      <Field
        label="Total budget"
        value={form.budget}
        onChange={(budget) => setForm({ ...form, budget })}
      />
    </>,
    <>
      <Field
        label="Target audience"
        value={form.audience}
        onChange={(audience) => setForm({ ...form, audience })}
        multiline
      />
      <Field
        label="Location"
        value={form.location}
        onChange={(location) => setForm({ ...form, location })}
      />
    </>,
    <>
      <Field
        label="Platforms"
        value={form.platforms}
        onChange={(platforms) => setForm({ ...form, platforms })}
      />
      <Field
        label="Requirements"
        value={form.requirements}
        onChange={(requirements) => setForm({ ...form, requirements })}
        multiline
      />
    </>,
  ]
  const steps = [
    "Business & Product",
    "Goal & Budget",
    "Audience & Location",
    "Platforms & Requirements",
  ]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step < 3) setStep(step + 1)
    else onComplete()
  }
  return (
    <>
      <Heading
        eyebrow="CAMPAIGNS / NEW CAMPAIGN"
        title="Begin with the right foundation"
        subtitle="Build a commercial brief that your partnership intelligence can reason about."
      />
      <div className="stepper">
        {steps.map((label, index) => (
          <div
            className={index === step ? "current" : index < step ? "done" : ""}
            key={label}
          >
            <i>{index < step ? "✓" : index + 1}</i>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="builder-grid">
        <Card>
          <div className="card-title">
            <div>
              <h2>{steps[step]}</h2>
              <p>Step {step + 1} of 4 · Keep the brief simple and specific.</p>
            </div>
            <Badge tone="success">Draft saved</Badge>
          </div>
          <form className="form-grid" onSubmit={submit}>
            {fields[step]}
            <div className="form-actions">
              {step > 0 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button type="submit">
                {step === 3 ? "Find Partners →" : "Continue →"}
              </Button>
            </div>
          </form>
        </Card>
        <div className="side-stack">
          <Card>
            <h2>Your campaign blueprint</h2>
            <Badge tone="warning">Draft · not launched</Badge>
            <div className="summary-list">
              {Object.entries(form)
                .slice(0, step * 2 + 2)
                .map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
            </div>
          </Card>
          <Card className="insight">
            <b>MYSTIQUE · Brief integrity</b>
            <h3>Clear enough to match</h3>
            <p>
              Your audience, budget and requirements will be used together to
              find suitable partners.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function MatchCard({
  partner,
  onDetails,
  onSelect,
}: {
  partner: typeof partners[number]
  onDetails: () => void
  onSelect: () => void
}) {
  const score = match(partner.fit)
  return (
    <Card className="match-card">
      <div className="match-top">
        <div className={`portrait ${!partner.image ? "agency" : ""}`}>
          {partner.image ? (
            <img src={partner.image} alt={partner.name} />
          ) : (
            "SL"
          )}
        </div>
        <div className="match-person">
          <h2>{partner.name}</h2>
          <p>{partner.subtitle}</p>
          <Badge>
            {partner.id === "lumen" ? "Creative Agency" : "Creator"}
          </Badge>
        </div>
        <div className="score">
          <span>WHAT HAPPENED</span>
          <strong>{score}%</strong>
          <Badge tone={score >= 92 ? "success" : "neutral"}>
            {matchLabel(score)}
          </Badge>
        </div>
      </div>
      <div className="why">
        <span>Why?</span>
        <strong>{partner.why}</strong>
      </div>
      <div className="proof-row">
        {partner.proof.map((proof) => (
          <span key={proof}>✓ {proof}</span>
        ))}
      </div>
      <div className="match-actions">
        <Button variant="secondary" onClick={onDetails}>
          View Details
        </Button>
        <Button onClick={onSelect}>Select Partner</Button>
      </div>
    </Card>
  )
}

function Matches({
  go,
  select,
}: {
  go: (screen: Screen) => void
  select: (id: string) => void
}) {
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="INTELLIGENCE / GLOWSKIN SKINCARE LAUNCH"
          title="Find undeniable resonance"
          subtitle="Curated for commercial outcomes. Ranked by evidence, not follower counts."
        />
        <Button variant="secondary" onClick={() => go("create")}>
          Edit matching brief
        </Button>
      </div>
      <div className="filter-row">
        <Badge>Creators</Badge>
        <Badge>Creative Agencies</Badge>
        <Badge tone="success">Within ₹75,000 cap</Badge>
      </div>
      <div className="matches-layout">
        <div className="match-list">
          {partners.map((partner) => (
            <MatchCard
              key={partner.id}
              partner={partner}
              onDetails={() => {
                select(partner.id)
                go("partner")
              }}
              onSelect={() => {
                select(partner.id)
                go("agreement")
              }}
            />
          ))}
        </div>
        <div className="side-stack sticky">
          <Card>
            <h2>Your shortlist · 2</h2>
            <p>GlowSkin Skincare Launch</p>
            <div className="shortlist">
              <strong>
                Aarav Sharma <span>₹70,000</span>
              </strong>
              <small>94% compatibility · Instagram</small>
              <strong>
                Isha Mehta <span>₹58,000</span>
              </strong>
              <small>91% compatibility · Instagram</small>
            </div>
            <hr />
            <b>₹1,28,000 estimated base commitment</b>
          </Card>
          <Card className="assistant-card">
            <div className="spark">
              <img src={`${A}/bff7d.svg`} alt="" />
            </div>
            <h3>Why Aarav leads</h3>
            <p>
              Highest audience overlap, verified recent performance and reliable
              delivery within your budget.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function PartnerDetail({
  partner,
  requestInstagram,
  connectionRequested,
  go,
}: {
  partner: typeof partners[number]
  requestInstagram: () => void
  connectionRequested: boolean
  go: (screen: Screen) => void
}) {
  const exportProfile = () => {
    const content = [
      "Mystique Partner Profile",
      partner.name,
      partner.subtitle,
      `Compatibility: ${match(partner.fit)}%`,
      `Package: ${partner.budget}`,
      `Why recommended: ${partner.why}`,
      "",
      "Evidence",
      ...partner.proof.map((item) => `- ${item}`),
    ].join("\n")
    downloadTextFile(
      `${partner.name.toLowerCase().replace(/\s+/g, "-")}-mystique-profile.txt`,
      content,
    )
  }
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="AI MATCHES / CREATOR DOSSIER"
          title="The evidence behind the influence"
          subtitle="Useful profile and performance information, without inflated complexity."
        />
        <Button variant="secondary" onClick={exportProfile}>
          Export profile
        </Button>
      </div>
      <Card className="profile-hero">
        <div className="portrait large">
          {partner.image ? (
            <img src={partner.image} alt={partner.name} />
          ) : (
            "SL"
          )}
        </div>
        <div>
          <div className="title-inline">
            <h1>{partner.name}</h1>
            <Badge tone="success">Identity verified</Badge>
          </div>
          <p>{partner.subtitle} · English / Hindi</p>
          <p>{partner.why}</p>
        </div>
        <div className="profile-score">
          <strong>{match(partner.fit)}%</strong>
          <span>GlowSkin compatibility</span>
          <Button onClick={() => go("agreement")}>Select Partner</Button>
        </div>
      </Card>
      <div className="stat-grid four">
        {[
          ["RECENT PERFORMANCE", "4.2×", "Across comparable campaigns"],
          ["AUDIENCE FIT", "78%", "Target audience overlap"],
          ["ON-TIME RELIABILITY", "98%", "49 of 50 milestones met"],
          ["AVAILABILITY", "May 10", "Next opening"],
        ].map(([a, b, c]) => (
          <Card className="stat-card" key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
            <small className="green">{c}</small>
          </Card>
        ))}
      </div>
      <div className="split">
        <div className="side-stack">
          <Card>
            <h2>Audience summary</h2>
            <div className="audience">
              <div className="ring">
                <strong>94.6%</strong>
              </div>
              <div>
                <Badge tone="success">Authentic audience</Badge>
                <p>
                  Women 81% · India 88%
                  <br />
                  Age 22–34: 68%
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h2>Previous relevant campaigns</h2>
            {[
              "Radiance Lab · 4.2× return",
              "DermaKind · 4.5× return",
              "Daily Rituals · 3.8× return",
            ].map((item) => (
              <div className="history" key={item}>
                {item}
                <Badge tone="success">Completed</Badge>
              </div>
            ))}
          </Card>
        </div>
        <div className="side-stack">
          <Card>
            <h2>Pricing & availability</h2>
            <div className="price-row">
              <span>Instagram Reel</span>
              <strong>₹30,000</strong>
            </div>
            <div className="price-row">
              <span>Vertical Story</span>
              <strong>₹5,000</strong>
            </div>
            <hr />
            <strong>2 Reels + 3 Stories · ₹75,000</strong>
          </Card>
          <Card>
            <h2>Instagram</h2>
            <p>
              {connectionRequested
                ? "Instagram authentication is not configured yet. No profile data has been imported."
                : "Connect an account to bring in available profile and performance information."}
            </p>
            <Button
              variant={connectionRequested ? "secondary" : "primary"}
              onClick={requestInstagram}
            >
              {connectionRequested
                ? "Instagram setup required"
                : "Connect Instagram"}
            </Button>
          </Card>
          <Card className="insight">
            <b>Why Mystique Recommended This</b>
            <p>
              Based on audience fit, recent performance, campaign requirements
              and availability.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function Agreement({ go }: { go: (screen: Screen) => void }) {
  const [status, setStatus] = useState("Draft")
  const stages = ["Draft", "Sent", "Accepted", "Active", "Completed"]
  const advance = () =>
    setStatus(stages[Math.min(stages.indexOf(status) + 1, stages.length - 1)])
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="PARTNERSHIP ROOMS / AGREEMENT"
          title="Creator partnership agreement"
          subtitle="GlowSkin × Aarav Sharma · A clear, editable agreement."
        />
        <Button variant="secondary" onClick={() => window.print()}>
          Download PDF
        </Button>
      </div>
      <div className="agreement-status">
        {stages.map((stage) => (
          <div
            className={
              stage === status
                ? "current"
                : stages.indexOf(stage) < stages.indexOf(status)
                  ? "done"
                  : ""
            }
            key={stage}
          >
            {stage}
          </div>
        ))}
      </div>
      <div className="agreement-layout">
        <Card className="document">
          <div className="doc-brand">
            Mystique <span>GS-AS-025 · DRAFT v0.3</span>
          </div>
          <h1>Creator Partnership Agreement</h1>
          <p>GlowSkin Skincare Launch · India</p>
          <hr />
          <h3>01 · Commercial purpose</h3>
          <p>
            Aarav Sharma will create trusted skincare content for the Barrier
            Restore Serum launch.
          </p>
          <div className="doc-columns">
            <div>
              <h3>02A · Deliverables</h3>
              <p>
                2 Instagram Reels and 3 vertical Stories with tracked links and
                partnership tags.
              </p>
            </div>
            <div>
              <h3>02B · Deadline</h3>
              <p>Drafts by 16 May. Approved content published by 24 May.</p>
            </div>
          </div>
          <h3>03 · Payment</h3>
          <div className="agreement-table">
            <span>Draft approval</span>
            <b>40% · ₹28,000</b>
            <span>Publication</span>
            <b>60% · ₹42,000</b>
          </div>
          <h3>04 · Revisions</h3>
          <p>
            Two revision rounds are included. Changes outside scope require
            explicit approval.
          </p>
          <h3>05 · Reporting requirements</h3>
          <p>
            Tracked links, platform insights and a final performance report
            within 7 days.
          </p>
        </Card>
        <div className="side-stack">
          <Card>
            <h2>Execution readiness</h2>
            <div className="summary-list">
              <div>
                <span>Current status</span>
                <strong>{status}</strong>
              </div>
              <div>
                <span>Required signatures</span>
                <strong>{status === "Draft" ? "0 of 3" : "2 of 3"}</strong>
              </div>
              <div>
                <span>Escrow</span>
                <strong>₹70,000 · Not funded</strong>
              </div>
            </div>
            <Button onClick={advance} disabled={status === "Completed"}>
              {status === "Draft"
                ? "Send agreement"
                : status === "Sent"
                  ? "Mark accepted"
                  : status === "Accepted"
                    ? "Start partnership"
                    : "Move forward"}
            </Button>
            {status === "Active" && (
              <Button variant="secondary" onClick={() => go("room")}>
                Open Partnership Room
              </Button>
            )}
          </Card>
          <Card className="insight">
            <b>Contract reconciliation</b>
            <p>
              Fee lines reconcile to ₹70,000 and the deliverables match the
              selected package.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

function PartnershipRoom({ go }: { go: (screen: Screen) => void }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    "Aarav: I’ve uploaded the first Reel draft for review.",
    "Alex: Thank you. The product framing looks strong.",
  ])
  const send = () => {
    if (message.trim()) {
      setMessages([...messages, `You: ${message}`])
      setMessage("")
    }
  }
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="PARTNERSHIP ROOMS / GS-AS-025"
          title="GlowSkin × Aarav Sharma"
          subtitle="One shared room for every commitment, conversation and decision."
        />
        <Badge tone="success">Active</Badge>
      </div>
      <div className="room-progress">
        {[
          "Brief",
          "Partner selected",
          "Agreement",
          "Active",
          "Content",
          "Published",
          "Completed",
        ].map((item, i) => (
          <span className={i < 4 ? "done" : ""} key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="room-tabs">
        <b>Overview</b>
        <b>Agreement</b>
        <b className="active">Conversation</b>
        <b>Deliverables</b>
        <b>Payments</b>
        <b>Changes</b>
      </div>
      <div className="split">
        <Card>
          <h2>Live conversation</h2>
          <p className="muted">
            Shared between GlowSkin, Aarav and the campaign agent.
          </p>
          <div className="messages">
            {messages.map((item, i) => (
              <div
                className={item.startsWith("You") ? "mine" : ""}
                key={`${item}-${i}`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="composer">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message or request a change..."
            />
            <Button onClick={send}>Send</Button>
          </div>
        </Card>
        <div className="side-stack">
          <Card className="assistant-card">
            <div className="spark">
              <img src={`${A}/bff7d.svg`} alt="" />
            </div>
            <h3>Partnership summary</h3>
            <p>
              2 Reels + 3 Stories · ₹70,000
              <br />
              Next deadline: First draft · 16 May
            </p>
          </Card>
          <Card>
            <h2>Deliverables</h2>
            {[
              "Reel 01 · Draft uploaded",
              "Reel 02 · In progress",
              "Stories · Not started",
            ].map((item, i) => (
              <div className="history" key={item}>
                {item}
                <Badge tone={i === 0 ? "warning" : "neutral"}>
                  {i === 0 ? "Approval Needed" : "Active"}
                </Badge>
              </div>
            ))}
          </Card>
          <Button onClick={() => go("approvals")}>
            Review approval request
          </Button>
        </div>
      </div>
    </>
  )
}

function Approvals({ go }: { go: (screen: Screen) => void }) {
  const [decision, setDecision] = useState("")
  return (
    <>
      <Heading
        eyebrow="CONTROL CENTER / HUMAN OVERSIGHT"
        title="Every intervention, accountable"
        subtitle="Policy gates pause execution. People approve commitments."
      />
      <div className="stat-grid four">
        {[
          ["PENDING APPROVALS", decision ? "1" : "2"],
          ["BLOCKED CHANGES", "1"],
          ["PROPOSED FEE INCREASE", "₹6,000"],
          ["CONTROL COVERAGE", "5 / 5"],
        ].map(([a, b]) => (
          <Card className="stat-card" key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
          </Card>
        ))}
      </div>
      <div className="governance-layout">
        <div className="side-stack">
          <Card className="approval-card">
            <div className="card-title">
              <div>
                <Badge tone="warning">{decision || "Approval Needed"}</Badge>
                <h2>Additional deliverables requested</h2>
              </div>
              <span>Today · 14:00</span>
            </div>
            <p>
              The creator requested 2 additional deliverables that are not
              included in the agreement.
            </p>
            <dl>
              <dt>Why</dt>
              <dd>
                The brand asked for two cutdowns after the scope was accepted.
              </dd>
              <dt>What next</dt>
              <dd>
                Approve the change, reject it, or discuss revised scope and
                payment.
              </dd>
            </dl>
            {!decision ? (
              <div className="match-actions">
                <Button onClick={() => setDecision("Approved")}>
                  Approve Change
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDecision("Rejected")}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDecision("Discussion started")}
                >
                  Discuss
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setDecision("")}>
                Undo decision
              </Button>
            )}
          </Card>
          <Card>
            <h2>Policy monitor</h2>
            {[
              "Disclosure tags",
              "Commercial caps",
              "Revision entitlements",
              "Competitor exclusions",
            ].map((item) => (
              <div className="history" key={item}>
                {item}
                <Badge tone="success">Enabled</Badge>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <h2>Blocked · Action required</h2>
          <Badge tone="danger">High · Publish blocked</Badge>
          <h3>Disclosure tag missing</h3>
          <p>
            Reel draft omits the paid partnership label. Return it for
            correction before publication.
          </p>
          <Button variant="secondary" onClick={() => go("room")}>
            Open deliverable
          </Button>
        </Card>
      </div>
    </>
  )
}

function CampaignRecommendations({
  go,
  select,
  connectionRequested,
  requestInstagram,
}: {
  go: (screen: Screen) => void
  select: (id: string) => void
  connectionRequested: boolean
  requestInstagram: () => void
}) {
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="CAMPAIGNS FOR YOU"
          title="Campaigns that fit your work"
          subtitle="The same matching intelligence, looking from your side of the partnership."
        />
      </div>
      <Card className="instagram-strip">
        <div>
          <h2>
            {connectionRequested
              ? "Instagram setup required"
              : "Connect Instagram"}
          </h2>
          <p>
            {connectionRequested
              ? "No Instagram data has been imported. Configure the backend integration to enable connection."
              : "Bring in available profile and performance information when the API is connected."}
          </p>
        </div>
        <Button
          variant={connectionRequested ? "secondary" : "primary"}
          onClick={requestInstagram}
        >
          {connectionRequested
            ? "Instagram setup required"
            : "Connect Instagram"}
        </Button>
      </Card>
      <div className="campaign-recs">
        {campaigns.map((campaign) => {
          const score = match(campaign.fit)
          return (
            <Card key={campaign.id}>
              <div className="card-title">
                <Badge tone={score >= 92 ? "success" : "neutral"}>
                  {matchLabel(score)}
                </Badge>
                <strong className="big-score">{score}%</strong>
              </div>
              <h2>{campaign.name}</h2>
              <p>
                {campaign.company} · {campaign.category}
              </p>
              <div className="why">
                <span>Why?</span>
                <strong>{campaign.why}</strong>
              </div>
              <div className="campaign-facts">
                <span>
                  <small>Budget</small>
                  {campaign.budget}
                </span>
                <span>
                  <small>Deliverables</small>
                  {campaign.deliverables}
                </span>
                <span>
                  <small>Deadline</small>
                  {campaign.deadline}
                </span>
              </div>
              <Button
                onClick={() => {
                  select(campaign.id)
                  go("campaign-detail")
                }}
              >
                View Campaign
              </Button>
            </Card>
          )
        })}
      </div>
    </>
  )
}

function CampaignDetail({
  campaign,
  go,
}: {
  campaign: typeof campaigns[number]
  go: (screen: Screen) => void
}) {
  return (
    <>
      <div className="heading-row">
        <Heading
          eyebrow="CAMPAIGN DETAILS"
          title={campaign.name}
          subtitle={`${campaign.company} · ${campaign.category}`}
        />
        <Badge tone="success">{matchLabel(match(campaign.fit))}</Badge>
      </div>
      <div className="split">
        <div className="side-stack">
          <Card>
            <h2>Campaign overview</h2>
            <p>
              Introduce a new barrier-care routine through useful, trusted
              content for skincare-conscious audiences in India.
            </p>
            <div className="campaign-facts vertical">
              <span>
                <small>Budget</small>
                {campaign.budget}
              </span>
              <span>
                <small>Deliverables</small>
                {campaign.deliverables}
              </span>
              <span>
                <small>Deadline</small>
                {campaign.deadline}
              </span>
            </div>
          </Card>
          <Card>
            <h2>Requirements</h2>
            <ul>
              <li>Original, educational product demonstration</li>
              <li>Paid partnership disclosure</li>
              <li>Tracked product link and performance report</li>
              <li>Two revision rounds included</li>
            </ul>
          </Card>
        </div>
        <div className="side-stack">
          <Card className="insight">
            <b>Why this match?</b>
            <p>{campaign.why}</p>
            <p>
              Based on your audience, recent performance and campaign
              requirements.
            </p>
          </Card>
          <Card>
            <h2>Ready to join?</h2>
            <p>
              Your profile will be shared with the campaign team. No commitment
              is made until an agreement is accepted.
            </p>
            <Button onClick={() => go("application")}>Apply to Campaign</Button>
          </Card>
        </div>
      </div>
    </>
  )
}

function Application({
  campaign,
  go,
}: {
  campaign: typeof campaigns[number]
  go: (screen: Screen) => void
}) {
  const [submitted, setSubmitted] = useState(false)
  const [note, setNote] = useState(
    "I’d love to create a practical, ingredient-led story for this launch.",
  )
  if (submitted)
    return (
      <div className="success-state">
        <div className="success-mark">✓</div>
        <Heading
          title="Application sent"
          subtitle={`Your application for ${campaign.name} is now under review.`}
        />
        <Badge tone="warning">Needs Review</Badge>
        <p>
          You’ll see any update here. If accepted, Mystique will guide both
          sides through the agreement and Partnership Room.
        </p>
        <Button onClick={() => go("campaigns")}>Browse more campaigns</Button>
      </div>
    )
  return (
    <>
      <Heading
        eyebrow="APPLICATION"
        title={`Apply to ${campaign.name}`}
        subtitle="A short note is all the campaign team needs."
      />
      <Card className="application-form">
        <Field label="Your note" value={note} onChange={setNote} multiline />
        <div className="application-summary">
          <strong>Profile shared</strong>
          <span>
            Audience summary · Recent performance · Availability · Pricing
          </span>
        </div>
        <Button onClick={() => setSubmitted(true)}>Send Application</Button>
      </Card>
    </>
  )
}

function AccountSettings({ logout }: { logout: () => Promise<void> }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""))
  }, [])

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")
    if (password.length < 8) {
      setError("Use a password of at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setPassword("")
    setConfirmPassword("")
    setMessage("Your Mystique password has been changed successfully.")
  }

  return (
    <>
      <Heading
        eyebrow="ACCOUNT / SECURITY"
        title="Account settings"
        subtitle="Manage your sign-in details and keep your Mystique account secure."
      />
      <div className="account-layout">
        <Card>
          <div className="card-title">
            <div>
              <h2>Change password</h2>
              <p>Choose a unique password you do not use elsewhere.</p>
            </div>
            <Badge tone="success">Secure account</Badge>
          </div>
          <form className="account-form" onSubmit={changePassword}>
            <Field
              label="Account email"
              value={email}
              onChange={setEmail}
              type="email"
              readOnly
            />
            <Field
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              type="password"
            />
            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your new password"
              type="password"
            />
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="login-success" role="status">
                {message}
              </div>
            )}
            <div className="account-actions">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Change password"}
              </Button>
            </div>
          </form>
        </Card>
        <div className="side-stack">
          <Card className="insight">
            <b>MYSTIQUE · Account security</b>
            <h3>Your session is protected</h3>
            <p>
              Password updates are handled securely by Supabase Auth. Mystique
              never stores your password.
            </p>
          </Card>
          <Card>
            <h2>Sign out</h2>
            <p>End your current Mystique session on this device.</p>
            <Button variant="secondary" onClick={logout}>
              Sign out
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login")
  const [authReady, setAuthReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [passwordRecovery, setPasswordRecovery] = useState(
    () =>
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery"),
  )
  const [role, setRole] = useState<Role>("business")
  const [selectedPartner, setSelectedPartner] = useState("aarav")
  const [selectedCampaign, setSelectedCampaign] = useState("radiance")
  const [instagramSetupRequested, setInstagramSetupRequested] = useState(false)
  const partner = useMemo(
    () => partners.find((item) => item.id === selectedPartner) ?? partners[0],
    [selectedPartner],
  )
  const campaign = useMemo(
    () =>
      campaigns.find((item) => item.id === selectedCampaign) ?? campaigns[0],
    [selectedCampaign],
  )
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const signedIn = Boolean(data.session)
      setAuthenticated(signedIn)
      setScreen((current) =>
        signedIn && current === "login" ? "landing" : current,
      )
      setAuthReady(true)
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const signedIn = Boolean(session)
      setAuthenticated(signedIn)
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true)
        setScreen("login")
        setAuthReady(true)
        return
      }
      setScreen((current) => {
        if (!signedIn) return "login"
        return current === "login" ? "landing" : current
      })
      setAuthReady(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const choose = (nextRole: Role) => {
    setRole(nextRole)
    setScreen(nextRole === "business" ? "dashboard" : "campaigns")
  }
  const logout = async () => {
    await supabase.auth.signOut()
  }
  if (!authReady)
    return (
      <main className="login-page">
        <div className="login-brand">
          <Brand />
        </div>
        <Card className="auth-loading">
          <div className="auth-spinner" />
          <h2>Preparing your workspace</h2>
          <p>Confirming your secure session...</p>
        </Card>
      </main>
    )
  if (passwordRecovery)
    return (
      <Login recovery onRecoveryComplete={() => setPasswordRecovery(false)} />
    )
  if (!authenticated || screen === "login") return <Login />
  if (screen === "landing") return <Landing onChoose={choose} />
  let page: ReactNode
  switch (screen) {
    case "dashboard":
      page = <Dashboard go={setScreen} />
      break
    case "create":
      page = <CreateCampaign onComplete={() => setScreen("matches")} />
      break
    case "matches":
      page = <Matches go={setScreen} select={setSelectedPartner} />
      break
    case "partner":
      page = (
        <PartnerDetail
          partner={partner}
          connectionRequested={instagramSetupRequested}
          requestInstagram={() => setInstagramSetupRequested(true)}
          go={setScreen}
        />
      )
      break
    case "agreement":
      page = <Agreement go={setScreen} />
      break
    case "room":
      page = <PartnershipRoom go={setScreen} />
      break
    case "approvals":
      page = <Approvals go={setScreen} />
      break
    case "campaigns":
      page = (
        <CampaignRecommendations
          go={setScreen}
          select={setSelectedCampaign}
          connectionRequested={instagramSetupRequested}
          requestInstagram={() => setInstagramSetupRequested(true)}
        />
      )
      break
    case "campaign-detail":
      page = <CampaignDetail campaign={campaign} go={setScreen} />
      break
    case "application":
      page = <Application campaign={campaign} go={setScreen} />
      break
    case "account":
      page = <AccountSettings logout={logout} />
      break
    default:
      page = <Dashboard go={setScreen} />
  }
  return (
    <Shell screen={screen} role={role} go={setScreen}>
      {page}
    </Shell>
  )
}
