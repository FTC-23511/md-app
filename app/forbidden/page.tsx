import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Not authorized</h1>
        <p className="text-sm text-muted-foreground">
          This account isn&apos;t on the allowlist for this app. If you think that&apos;s a mistake,
          contact the Documentation Captain.
        </p>
      </div>
      <div className="mt-8">
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/sign-in">Back to sign in</Link>
        </Button>
      </div>
    </main>
  );
}
