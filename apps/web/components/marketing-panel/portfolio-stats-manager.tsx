"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp } from "lucide-react";

type PortfolioStats = {
  activeProperties: number;
  averageRating: string;
  totalTurnovers: number;
  period: string;
  lastUpdated?: string;
};

export function PortfolioStatsManager() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    activeProperties: 0,
    averageRating: "0.00",
    totalTurnovers: 0,
    period: "",
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const response = await fetch("/api/marketing/stats/portfolio");
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error loading portfolio stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch("/api/marketing/stats/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          averageRating: parseFloat(formData.averageRating),
        }),
      });

      if (response.ok) {
        await loadStats();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error saving portfolio stats:", error);
    }
  }

  function openDialog() {
    if (stats) {
      setFormData({
        activeProperties: stats.activeProperties,
        averageRating: stats.averageRating,
        totalTurnovers: stats.totalTurnovers,
        period: stats.period,
      });
    }
    setIsDialogOpen(true);
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Estadísticas del Portfolio</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {stats ? "Actualizar" : "Crear"} Estadísticas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Actualizar Estadísticas del Portfolio</DialogTitle>
                <DialogDescription>
                  Las estadísticas se mostrarán en la galería de propiedades de
                  la landing page
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="activeProperties">
                      Propiedades Activas
                    </Label>
                    <Input
                      id="activeProperties"
                      type="number"
                      value={formData.activeProperties}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activeProperties: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="averageRating">Rating Promedio</Label>
                    <Input
                      id="averageRating"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.averageRating}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          averageRating: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalTurnovers">Total Turnovers</Label>
                    <Input
                      id="totalTurnovers"
                      type="number"
                      value={formData.totalTurnovers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalTurnovers: parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="period">Período</Label>
                    <Input
                      id="period"
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({ ...formData, period: e.target.value })
                      }
                      placeholder="Q4 2025"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats ? (
        <Card className="p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Propiedades Activas
              </p>
              <p className="text-4xl font-bold text-brisa-600 dark:text-brisa-400">
                {stats.activeProperties}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rating Promedio
              </p>
              <p className="text-4xl font-bold text-brisa-600 dark:text-brisa-400">
                {stats.averageRating}/5.0
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Turnovers
              </p>
              <p className="text-4xl font-bold text-brisa-600 dark:text-brisa-400">
                {stats.totalTurnovers.toLocaleString()}+
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Período
              </p>
              <p className="text-4xl font-bold text-brisa-600 dark:text-brisa-400">
                {stats.period}
              </p>
            </div>
          </div>

          {stats.lastUpdated && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Última actualización:{" "}
                {new Date(stats.lastUpdated).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              No hay estadísticas registradas
            </h3>
            <p className="text-gray-500">
              Crea las primeras estadísticas del portfolio para mostrarlas en la
              landing page.
            </p>
            <Button onClick={openDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Estadísticas
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
