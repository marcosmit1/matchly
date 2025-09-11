import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-9xl font-bold text-white">404</h1>
      <p className="text-white mt-4 text-xl text-muted-foreground">I am drunk, I am lost</p>
      <Link href="/" className="mt-4 flex items-center gap-2">
        <ChevronLeft className="text-white" size={20} />{" "}
        <span className="text-white underline underline-offset-4">Go back to home</span>
      </Link>
    </div>
  );
}
