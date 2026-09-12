import RequireAuth from "@/components/RequireAuth";
import OnboardingWizard from "@/components/OnboardingWizard";

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <main>
        <OnboardingWizard />
      </main>
    </RequireAuth>
  );
}
