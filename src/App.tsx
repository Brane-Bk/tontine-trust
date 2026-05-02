import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";

import Splash from "./pages/Splash";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import Home from "./pages/Home";
import Rechercher from "./pages/Rechercher";
import Rejoindre from "./pages/Rejoindre";
import GroupeDetail from "./pages/GroupeDetail";
import CreerGroupe from "./pages/CreerGroupe";
import Cotiser from "./pages/Cotiser";
import Confirmation from "./pages/Confirmation";
import Score from "./pages/Score";
import Historique from "./pages/Historique";
import Notifications from "./pages/Notifications";
import Profil from "./pages/Profil";
import Parametres from "./pages/Parametres";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Splash />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/home" element={<Home />} />
              <Route path="/rechercher" element={<Rechercher />} />
              <Route path="/rejoindre/:id" element={<Rejoindre />} />
              <Route path="/groupe/:id" element={<GroupeDetail />} />
              <Route path="/creer" element={<CreerGroupe />} />
              <Route path="/cotiser" element={<Cotiser />} />
              <Route path="/confirmation" element={<Confirmation />} />
              <Route path="/score" element={<Score />} />
              <Route path="/historique" element={<Historique />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
