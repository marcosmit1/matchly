import { LoadingSpinner } from "@/components/loading-spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center px-4 py-10">
      <LoadingSpinner size="lg" color="blue" />
    </div>
  );
}
