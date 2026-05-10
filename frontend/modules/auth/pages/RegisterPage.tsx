"use client";

import { RegisterForm } from "../components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Register to get started
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
