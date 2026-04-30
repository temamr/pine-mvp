import { Suspense } from "react";
import { SellWizardScreen } from "@/features/listings/components/sell-wizard-screen";

export default function SellPage() {
  return (
    <Suspense fallback={null}>
      <SellWizardScreen />
    </Suspense>
  );
}
