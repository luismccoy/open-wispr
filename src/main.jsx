import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ControlPanel from "./components/ControlPanel.tsx";
import OnboardingFlow from "./components/OnboardingFlow.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import "./index.css";

function AppRouter() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is the control panel window
  const isControlPanel =
    window.location.pathname.includes("control") ||
    window.location.search.includes("panel=true");

  // Check if this is the dictation panel (main app)
  const isDictationPanel = !isControlPanel;

  useEffect(() => {
    // Debug: Log localStorage values on startup
    const debugValues = {
      useReasoningModel: localStorage.getItem("useReasoningModel"),
      reasoningModel: localStorage.getItem("reasoningModel"),
      onboardingCompleted: localStorage.getItem("onboardingCompleted"),
      isControlPanel,
      isDictationPanel,
      pathname: window.location.pathname,
      search: window.location.search,
      href: window.location.href
    };
    console.log('[AppRouter] ========================================');
    console.log('[AppRouter] STARTUP - Window info:');
    console.log('[AppRouter]   pathname:', debugValues.pathname);
    console.log('[AppRouter]   search:', debugValues.search);
    console.log('[AppRouter]   href:', debugValues.href);
    console.log('[AppRouter]   isControlPanel:', isControlPanel);
    console.log('[AppRouter]   isDictationPanel:', isDictationPanel);
    console.log('[AppRouter]   onboardingCompleted:', debugValues.onboardingCompleted);
    console.log('[AppRouter] ========================================');
    
    // Try to send debug log to main process
    if (window.electronAPI && window.electronAPI.debugLog) {
      window.electronAPI.debugLog('AppRouter startup', debugValues)
        .then(() => console.log('[AppRouter] Debug log sent to main process'))
        .catch(err => console.error('[AppRouter] Debug log failed:', err));
    } else {
      console.log('[AppRouter] electronAPI.debugLog not available');
    }

    // Check if onboarding has been completed
    const onboardingCompleted =
      localStorage.getItem("onboardingCompleted") === "true";
    const currentStep = parseInt(
      localStorage.getItem("onboardingCurrentStep") || "0"
    );

    if (isControlPanel && !onboardingCompleted) {
      // Show onboarding for control panel if not completed
      setShowOnboarding(true);
    }

    // Hide dictation panel window unless onboarding is complete or we're past the permissions step
    if (isDictationPanel && !onboardingCompleted && currentStep < 4) {
      console.log('[AppRouter] Hiding dictation panel - onboarding not complete');
      window.electronAPI?.hideWindow?.();
    } else if (isDictationPanel) {
      console.log('[AppRouter] Dictation panel will render - onboarding complete or past step 4');
    }

    setIsLoading(false);
  }, [isControlPanel, isDictationPanel]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("onboardingCompleted", "true");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Ollie...</p>
        </div>
      </div>
    );
  }

  if (isControlPanel && showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return isControlPanel ? <ControlPanel /> : <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </React.StrictMode>
);
