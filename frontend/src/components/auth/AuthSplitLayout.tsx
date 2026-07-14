import Image from "next/image";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="relative hidden bg-primary/5 md:block md:w-1/2">
        <Image
          src="/images/auth-illustration.png"
          alt="Isometric illustration of people managing schedules, tasks, and plans, titled Effective Management"
          fill
          priority
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
