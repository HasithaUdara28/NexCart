type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ size = 'md' }: { size?: Size }) {
  return (
    <div
      className={`${sizeMap[size]} border-blue-500 border-t-transparent rounded-full animate-spin`}
    />
  );
}
