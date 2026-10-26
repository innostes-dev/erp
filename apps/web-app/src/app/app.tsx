import { Alert, AlertDescription, AlertTitle } from '@innostes/ui';

/**
 * The application shown after first-run setup.
 *
 * Placeholder until the app shell (sidebar, routing, plug-in pages) is built.
 */
export function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold tracking-tight">innostes ERP</h1>
      <Alert variant="success">
        <AlertTitle>Setup is complete</AlertTitle>
        <AlertDescription>
          The system is installed. The app shell and module pages will appear here.
        </AlertDescription>
      </Alert>
    </main>
  );
}

export default App;
