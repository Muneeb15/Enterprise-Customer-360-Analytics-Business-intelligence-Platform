import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="size-8 bg-brand rounded-[6px]" />
            <span className="font-semibold text-lg tracking-tight">Nexus Analytics</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Create your workspace and get started
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
