import { ProductIcon, supportIconKind } from "@/components/marketing/ProductIcon";

export function SupportPathIcon({ id }: { id: string }) {
  return <ProductIcon kind={supportIconKind(id)} className="support-path__icon" size={80} />;
}
