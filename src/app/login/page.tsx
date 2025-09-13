"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        router.push("/buyers/new");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Demo Login</h1>
      <button
        onClick={handleDemoLogin}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Logging in..." : "Login as Demo User"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
