import { PublicRoute } from "@/components/AuthRouteGuards";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicRoute>{children}</PublicRoute>;
}
