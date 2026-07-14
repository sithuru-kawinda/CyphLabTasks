import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      imageSrc="/images/register-illustration.png"
      imageAlt="Illustration of a person tracking Start, Progress, In Test, and Complete task columns on a phone"
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}
