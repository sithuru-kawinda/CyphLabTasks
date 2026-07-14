import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function RegisterPage() {
  return (
    <AuthSplitLayout>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
