import { LoginForm } from "@/components/auth/LoginForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function LoginPage() {
  return (
    <AuthSplitLayout
      imageSrc="/images/login-illustration.png"
      imageAlt="Illustration of two people planning a project on a giant calendar"
    >
      <LoginForm />
    </AuthSplitLayout>
  );
}
