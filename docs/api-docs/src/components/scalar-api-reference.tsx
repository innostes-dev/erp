'use client';

interface ScalarApiReferenceProps {
  specUrl?: string;
}

export function ScalarApiReference({ specUrl }: ScalarApiReferenceProps) {
  const targetUrl =
    specUrl ||
    (process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/reference`
      : 'http://localhost:3000/reference');

  return (
    <div className="w-full h-[calc(100vh-7rem)] bg-[#0c0d0e] rounded-xl overflow-hidden border border-neutral-800/80 shadow-2xl">
      <iframe
        src={targetUrl}
        className="w-full h-full border-0 bg-[#0c0d0e]"
        title="Innostes ERP Interactive API Reference"
      />
    </div>
  );
}
