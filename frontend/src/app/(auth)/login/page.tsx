import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}
