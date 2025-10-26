import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FinancialCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "success" | "primary" | "default" | "destructive";
  format?: "currency" | "percentage";
}

export const FinancialCard = ({ title, value, icon: Icon, variant, format = "currency" }: FinancialCardProps) => {
  const variantClasses = {
    success: "bg-gradient-success text-success-foreground",
    primary: "bg-gradient-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    default: value >= 0 ? "bg-gradient-success text-success-foreground" : "bg-destructive text-destructive-foreground",
  };

  const formatValue = (val: number) => {
    if (format === "percentage") {
      return `${val.toFixed(1)}%`;
    }
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="shadow-card hover:shadow-hover transition-all duration-300">
      <CardContent className={`${variantClasses[variant]} p-6 rounded-[calc(var(--radius)-4px)]`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          <Icon className="h-5 w-5 opacity-90" />
        </div>
        <p className="text-3xl font-bold">{formatValue(value)}</p>
      </CardContent>
    </Card>
  );
};
