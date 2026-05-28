import { SignInForm } from './sign-in-form';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Maximum Documentation</h1>
        <p className="text-sm text-muted-foreground">Sign in to file and review entries.</p>
      </div>

      <SignInForm
        resetSuccess={params.reset === 'success'}
        linkError={params.error === 'reset_failed' || params.error === 'no_code'}
      />
    </main>
  );
}
