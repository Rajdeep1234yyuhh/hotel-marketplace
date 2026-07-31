import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSession } from "@/lib/session";

export default function LoginPage() {
  const session = getSession();
  if (session) {
    redirect(session.role === "SELLER" ? "/seller" : "/browse");
  }

  return (
    <div className="container-page flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
