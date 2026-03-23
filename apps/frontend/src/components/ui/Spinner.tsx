interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS = { sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' };

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <span className={`loading loading-spinner ${SIZE_CLASS[size]} text-primary`} />
    </div>
  );
}
