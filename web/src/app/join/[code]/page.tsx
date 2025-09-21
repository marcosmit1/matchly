import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { JoinWithCode } from "./join-with-code";

interface JoinPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;
  
  const supabase = await createClient();
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    redirect(`/login?returnUrl=${encodeURIComponent(`/join/${code}`)}`);
  }

  return <JoinWithCode inviteCode={code} />;
}
