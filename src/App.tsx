import { useEffect } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { boot } from "./lib/state";
import { AchievementsPage } from "./pages/AchievementsPage";
import { CapturePage } from "./pages/CapturePage";
import { CollectionPage } from "./pages/CollectionPage";
import { EditorPage } from "./pages/EditorPage";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StickerDetailPage } from "./pages/StickerDetailPage";
import { AppShell } from "./ui/AppShell";

// HashRouter keeps the same build working later inside a Capacitor Android WebView.
const Router = window.location.protocol === "file:" ? HashRouter : BrowserRouter;

export function App() {
  useEffect(() => {
    void boot();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/sticker/:id" element={<StickerDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
