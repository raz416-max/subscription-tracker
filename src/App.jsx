import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LandingPage from "./LandingPage";
import Auth from "./Auth";
import Paywall from "./Paywall";
import SubscriptionTracker from "./SubscriptionTracker";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [plan, setPlan] = useState("none");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setSubscriptionStatus(null);
      setPlan("none");
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, plan")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        setSubscriptionStatus("inactive");
        setPlan("none");
      } else {
        setSubscriptionStatus(data?.subscription_status || "inactive");
        setPlan(data?.plan || "none");
      }
    })();
  }, [session]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!session) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;
    }
    return <Auth onAuthed={() => {}} />;
  }

  if (subscriptionStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Checking your subscription…
      </div>
    );
  }

  const onLogout = () => {
    supabase.auth.signOut();
    setShowAuth(false);
  };

  if (subscriptionStatus !== "active") {
    return <Paywall user={session.user} onLogout={onLogout} />;
  }

  return <SubscriptionTracker user={session.user} plan={plan} onLogout={onLogout} />;
}
