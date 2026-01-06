import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'orange' | 'pink' | 'yellow' | 'purple' | 'green' | 'blue' | 'red';
  loading?: boolean;
}

const variantStyles = {
  orange: "border-poh-orange text-poh-orange",
  pink: "border-poh-pink text-poh-pink",
  yellow: "border-poh-yellow text-poh-yellow",
  purple: "border-poh-tint-purple text-poh-tint-purple",
  green: "border-poh-tint-green text-poh-tint-green",
  blue: "border-poh-tint-blue text-poh-tint-blue",
  red: "border-poh-tint-red text-poh-tint-red",
};

const bgStyles = {
  orange: "bg-poh-orange/10",
  pink: "bg-poh-pink/10",
  yellow: "bg-poh-yellow/10",
  purple: "bg-poh-tint-purple/10",
  green: "bg-poh-tint-green/10",
  blue: "bg-poh-tint-blue/10",
  red: "bg-poh-tint-red/10",
};

export function StatCard({ title, value, description, variant = 'blue', loading }: StatCardProps) {
  return (
    <div className={cn(
      "p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg",
      "bg-poh-bg-secondary",
      variantStyles[variant]
    )}>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider text-poh-text-secondary">
          {title}
        </h3>
        {loading ? (
          <div className="h-10 w-24 animate-pulse bg-gray-200/20 rounded" />
        ) : (
          <div className="text-3xl font-bold font-mono">
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-poh-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
