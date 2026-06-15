import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccessApp } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware is the primary gate, but if it misconfigures
  // the layout still refuses to render protected content without a session.
  if (!user) {
    redirect('/auth/sign-in');
  }

  // Same membership gate as the middleware (Phase 3): an active member (or the
  // ALLOWED_EMAIL bootstrap account) only. A deactivated user who slips past a
  // stale middleware check is still refused here.
  if (!(await canAccessApp(supabase, user))) {
    redirect('/forbidden');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <span className="text-sm font-semibold tracking-tight">Maximum Documentation</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
