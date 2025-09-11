import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/blocks/button";
import { Plus, Target } from "lucide-react";

export default async function PlayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Play</h1>
      </div>
      
      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2">
            <Target className="w-5 h-5" />
            <span className="font-medium">Quick Match</span>
          </Button>
          <Link href="/create-league">
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl py-4 flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create League</span>
            </Button>
          </Link>
        </div>

        {/* Coming Soon Features */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Coming Soon</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Quick Matches</h3>
                <p className="text-sm text-gray-600">Start a quick match with friends</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Join Tournaments</h3>
                <p className="text-sm text-gray-600">Participate in existing tournaments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
