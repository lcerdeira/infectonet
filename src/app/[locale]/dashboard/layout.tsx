/**
 * Dashboard layout — provides consistent page padding for all /dashboard/* pages
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
}
