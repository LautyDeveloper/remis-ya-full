import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { MainLayout } from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Spinner } from '@/components/ui/spinner';

const Index = lazy(() => import('./pages/Index'));
const Choferes = lazy(() => import('./pages/Choferes'));
const Pasajeros = lazy(() => import('./pages/Pasajeros'));
const Telefonistas = lazy(() => import('./pages/Telefonistas'));
const Viajes = lazy(() => import('./pages/Viajes'));
const Reservas = lazy(() => import('./pages/Reservas'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Finanzas = lazy(() => import('./pages/Finanzas'));
const Gastos = lazy(() => import('./pages/Gastos'));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner className="w-8 h-8" /></div>}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/choferes" element={<Choferes />} />
                          <Route path="/pasajeros" element={<Pasajeros />} />
                          <Route path="/telefonistas" element={<Telefonistas />} />
                          <Route path="/viajes" element={<Viajes />} />
                          <Route path="/reservas" element={<Reservas />} />
                          <Route
                            path="/gastos"
                            element={
                              <ProtectedRoute requiredRole="dueño">
                                <Gastos />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/finanzas"
                            element={
                              <ProtectedRoute requiredRole="dueño">
                                <Finanzas />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
