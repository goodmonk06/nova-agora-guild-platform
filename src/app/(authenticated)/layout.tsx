import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return <>{children}</>;
}
