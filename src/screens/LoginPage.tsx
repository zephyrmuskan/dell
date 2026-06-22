import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AlertCircle, Info, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.32 -0.03,-0.64 -0.08,-0.9z" fill="#4285F4" />
    <path d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.08l-3.3,-2.58c-0.91,0.61 -2.08,0.98 -3.34,0.98c-2.57,0 -4.75,-1.74 -5.53,-4.07H2.03v2.66c1.44,2.87 4.41,4.81 7.87,4.81z" fill="#34A853" />
    <path d="M6.47,12.75a6.78,6.78 0 0 1 0,-2.3V7.79H2.03a11.19,11.19 0 0 0 0,9.92l4.44,-3.46z" fill="#FBBC05" />
    <path d="M12,6.1c1.25,0 2.37,0.43 3.25,1.28l2.44,-2.44C16.22,3.56 14.28,3 12,3c-3.46,0 -6.43,1.94 -7.87,4.81l4.44,3.46c0.78,-2.33 2.96,-4.07 5.53,-4.07z" fill="#EA4335" />
  </svg>
);

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);


    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onLogin();
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          onLogin();
        } else {
          setInfo("Account created! Please check your email for the verification link.");
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setInfo("");
    setIsLoading(true);


    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oAuthError) throw oAuthError;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Google Authentication failed.");
      setIsLoading(false);
    }
  };

  const loginWithGooglePersona = async (role: 'admin' | 'analyst' | 'stakeholder') => {
    setError("");
    setInfo("");
    setIsLoading(true);
    localStorage.setItem('oauth_persona', role);
    try {
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oAuthError) throw oAuthError;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg || "Google Authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen liquid-gradient flex items-center justify-center px-4 py-3 relative overflow-hidden font-sans select-none">
      {/* Decorative Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-brand-cyan/10 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-10 right-4 w-96 h-96 bg-brand-blue/15 rounded-full mix-blend-screen filter blur-3xl opacity-25 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-brand-navy/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 p-5 md:p-6">
          
          {/* Project Logo & Header */}
          <div className="text-center mb-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 shadow-[0_0_15px_rgba(0,210,255,0.15)]">
              <span className="text-brand-cyan text-lg font-black font-display">T</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white font-display">
              TrustLens AI
            </h1>
            <p className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest mt-1">
              Secure Agent Control Console
            </p>
          </div>

          {/* Success Info Message */}
          {info && (
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-brand-emerald/20 text-brand-emerald text-xs font-semibold leading-relaxed flex items-start gap-2">
              <Info className="h-4 w-4 text-brand-emerald flex-shrink-0 mt-0.5" />
              <div>{info}</div>
            </div>
          )}

          {/* Error Alert Message */}
          {error && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-brand-red/20 text-brand-red text-xs font-semibold leading-relaxed flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-brand-red flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-3 border border-white/10 hover:bg-white/5 text-white bg-white/5 font-bold text-sm rounded-xl transition duration-200 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-3 animate-spin text-white/50" />
            ) : (
              <GoogleIcon />
            )}
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </button>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[9px] font-extrabold uppercase tracking-widest">
              <span className="bg-[#122238] px-3.5 text-white/40">Or use email</span>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex mb-3 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => { setIsLogin(true); setError(""); setInfo(""); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                isLogin
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); setInfo(""); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                !isLogin
                  ? "bg-white/10 text-white shadow-sm border border-white/10"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          {/* Email Login/Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {!isLogin && (
              <div>
                <label className="block mb-0.5 text-[10px] font-bold text-white/70 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-white/10 bg-white/5 focus:bg-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan text-sm transition placeholder-white/30"
                />
              </div>
            )}

            <div>
              <label className="block mb-0.5 text-[10px] font-bold text-white/70 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="admin@trustlens.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-white/10 bg-white/5 focus:bg-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan text-sm transition placeholder-white/30"
              />
            </div>

            <div>
              <label className="block mb-0.5 text-[10px] font-bold text-white/70 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 border border-white/10 bg-white/5 focus:bg-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan text-sm transition placeholder-white/30"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block mb-0.5 text-[10px] font-bold text-white/70 uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-white/10 bg-white/5 focus:bg-white/10 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan text-sm transition placeholder-white/30"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-brand-cyan text-brand-navy font-black text-sm shadow-glow-blue hover:opacity-90 active:scale-95 transition duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>

            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest text-center mb-1.5 font-display">
                Sign in with Google as Target Persona:
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => loginWithGooglePersona('admin')}
                  className="p-1.5 rounded-xl border border-white/10 hover:border-brand-cyan hover:text-brand-cyan bg-white/5 text-white transition duration-200 flex flex-col items-center justify-between text-center cursor-pointer h-[72px] disabled:opacity-50"
                >
                  <span className="text-sm mt-0.5">🛠</span>
                  <span className="text-[10px] font-bold block leading-tight text-white mt-0.5 font-display">Admin</span>
                  <span className="text-[7px] text-white/40 block mt-0.5 font-mono uppercase tracking-wider">Primary</span>
                </button>
                
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => loginWithGooglePersona('analyst')}
                  className="p-1.5 rounded-xl border border-white/10 hover:border-brand-cyan hover:text-brand-cyan bg-white/5 text-white transition duration-200 flex flex-col items-center justify-between text-center cursor-pointer h-[72px] disabled:opacity-50"
                >
                  <span className="text-sm mt-0.5 font-display">🔍</span>
                  <span className="text-[10px] font-bold block leading-tight text-white mt-0.5 font-display">Analyst</span>
                  <span className="text-[7px] text-white/40 block mt-0.5 font-mono uppercase tracking-wider font-display">Secondary</span>
                </button>
                
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => loginWithGooglePersona('stakeholder')}
                  className="p-1.5 rounded-xl border border-white/10 hover:border-brand-cyan hover:text-brand-cyan bg-white/5 text-white transition duration-200 flex flex-col items-center justify-between text-center cursor-pointer h-[72px] disabled:opacity-50"
                >
                  <span className="text-sm mt-0.5 font-display">📋</span>
                  <span className="text-[10px] font-bold block leading-tight text-white mt-0.5 font-display">Officer</span>
                  <span className="text-[7px] text-white/40 block mt-0.5 font-mono uppercase tracking-wider font-display">Tertiary</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}