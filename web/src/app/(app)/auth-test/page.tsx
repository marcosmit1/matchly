import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthTestPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError
  } = await supabase.auth.getUser();

  console.log("Auth user:", authUser);
  console.log("Auth error:", authError);

  if (!authUser) {
    redirect("/login");
  }

  // Get user profile from database
  const { data: userdata, error: userError } = await supabase.from("users").select("*").eq("id", authUser.id).single();

  console.log("User data from database:", userdata);
  console.log("User error:", userError);

  if (userError) {
    console.error("Error fetching user data:", userError);
    redirect("/login");
  }

  if (!userdata) {
    console.error("No user data found");
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Auth User:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(authUser, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">Database User:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(userdata, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">Auth Error:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(authError, null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-700">User Error:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(userError, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
