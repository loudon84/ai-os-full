"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-primary underline">
          Register
        </a>
      </p>
    </form>
  );
}
