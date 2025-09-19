import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

export default function TournamentNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tournament Not Found</h1>
        <p className="text-gray-600 mb-8">
          The tournament you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Discover</span>
        </Link>
      </div>
    </div>
  );
}
