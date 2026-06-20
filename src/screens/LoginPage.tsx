import { useState } from "react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">

          {/* Project Name */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-3xl font-bold">T</span>
            </div>

            <h1 className="text-4xl font-bold text-slate-900">
              TrustLens AI
            </h1>

            <p className="text-slate-500 mt-2">
              Transparent & Trustworthy AI Agent Interface
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-8 border-b border-slate-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 font-medium transition ${
                isLogin
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 font-medium transition ${
                !isLogin
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500"
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {!isLogin && (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">
                  Confirm Password
                </label>

                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" />
                  Remember me
                </label>

                {/* <button
                  type="button"
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </button> */}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition"
            >
              {isLogin ? "Login" : "Create Account"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}