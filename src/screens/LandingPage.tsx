import { useEffect } from "react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "ENTER_APP") {
        onEnterApp();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEnterApp]);

  return (
    <iframe
      src="/landing.html"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    />
  );
}