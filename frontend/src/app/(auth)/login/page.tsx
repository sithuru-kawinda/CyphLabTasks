import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="hidden items-center justify-center bg-primary/5 p-10 md:flex md:w-1/2">
        <Image
          src="/images/login-illustration.png"
          alt="Illustration of two people planning a project on a giant calendar"
          width={600}
          height={520}
          priority
          className="h-auto w-full max-w-md"
        />
      </div>
      <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
