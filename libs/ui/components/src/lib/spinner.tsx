interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Spinner({ size = 'md', label = 'Loading...' }: SpinnerProps) {
  return (
    <div role="status" className="flex items-center justify-center">
      <span
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
