"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, User, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDemoLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        // Save user info in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to buyers page
        router.push("/buyers");
      }
    } catch (err) {
      setError(`Something went wrong ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-3">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-300">
            Access your buyer lead dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <LogIn className="w-5 h-5" />
              Demo Login
            </h2>
          </div>

          <div className="p-8">
            {/* Demo User Info */}
            <div className="bg-gray-700/50 rounded-2xl p-6 mb-8 border border-gray-600/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">Demo User</h3>
                  <p className="text-sm text-gray-400">demo@example.com</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Full access to buyer management</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Create and manage leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>View analytics and reports</span>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full cursor-pointer px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login as Demo User
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-900/50 border border-red-500/50 text-red-300">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                This is a demonstration environment with sample data.
                <br />
                No real authentication is required.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Secure • Fast • Reliable
          </p>
        </div>
      </div>
    </div>
  );
}