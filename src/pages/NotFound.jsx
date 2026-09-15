import { ArrowLeft } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import { ROUTES } from "../config/constants";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span className="font-mono text-sm text-text-tertiary">error 404</span>
      <h1 className="font-mono text-5xl font-semibold text-accent">
        not_found
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-text-secondary">
        There's nothing typed at this address. The page you're looking for
        doesn't exist or may have moved.
      </p>
      <Button to={ROUTES.home} variant="secondary" icon={ArrowLeft} iconPosition="leading">
        Back to home
      </Button>
    </PageContainer>
  );
}
