"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";

type PricingTier = {
  id: string;
  tierCode: string;
  name: string;
  headline: string;
  description?: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  addons?: string[];
  highlighted: boolean;
  order: number;
};

export function PricingManager() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [formData, setFormData] = useState({
    tierCode: "",
    name: "",
    headline: "",
    description: "",
    price: "",
    priceSuffix: "",
    features: "",
    addons: "",
    highlighted: false,
    order: 0,
  });

  useEffect(() => {
    loadTiers();
  }, []);

  async function loadTiers() {
    try {
      setLoading(true);
      const response = await fetch("/api/marketing/pricing?showAll=true");
      if (response.ok) {
        const data = await response.json();
        setTiers(data.data);
      }
    } catch (error) {
      console.error("Error loading pricing tiers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const features = formData.features
      .split("\n")
      .filter((f) => f.trim())
      .map((f) => f.trim());
    const addons = formData.addons
      .split("\n")
      .filter((a) => a.trim())
      .map((a) => a.trim());

    const payload = {
      tierCode: formData.tierCode,
      name: formData.name,
      headline: formData.headline,
      description: formData.description || undefined,
      price: formData.price,
      priceSuffix: formData.priceSuffix || undefined,
      features,
      addons: addons.length > 0 ? addons : undefined,
      highlighted: formData.highlighted,
      order: formData.order,
    };

    const url = editingTier
      ? `/api/marketing/pricing/${editingTier.id}`
      : "/api/marketing/pricing";

    const method = editingTier ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadTiers();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving pricing tier:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este plan de precios?")) return;

    try {
      const response = await fetch(`/api/marketing/pricing/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadTiers();
      }
    } catch (error) {
      console.error("Error deleting pricing tier:", error);
    }
  }

  function openDialog(tier?: PricingTier) {
    if (tier) {
      setEditingTier(tier);
      setFormData({
        tierCode: tier.tierCode,
        name: tier.name,
        headline: tier.headline,
        description: tier.description || "",
        price: tier.price,
        priceSuffix: tier.priceSuffix || "",
        features: tier.features.join("\n"),
        addons: tier.addons?.join("\n") || "",
        highlighted: tier.highlighted,
        order: tier.order,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingTier(null);
    setFormData({
      tierCode: "",
      name: "",
      headline: "",
      description: "",
      price: "",
      priceSuffix: "",
      features: "",
      addons: "",
      highlighted: false,
      order: tiers.length,
    });
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planes de Precios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTier ? "Editar" : "Nuevo"} Plan de Precios
                </DialogTitle>
                <DialogDescription>
                  Completa los datos del plan
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tierCode">Código</Label>
                    <Input
                      id="tierCode"
                      value={formData.tierCode}
                      onChange={(e) =>
                        setFormData({ ...formData, tierCode: e.target.value })
                      }
                      placeholder="turnover"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    placeholder="Turnos garantizados < 120 min"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="$249"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priceSuffix">Sufijo de Precio</Label>
                    <Input
                      id="priceSuffix"
                      value={formData.priceSuffix}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceSuffix: e.target.value,
                        })
                      }
                      placeholder="por salida confirmada"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="features">
                    Características (una por línea)
                  </Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) =>
                      setFormData({ ...formData, features: e.target.value })
                    }
                    rows={6}
                    placeholder="Limpieza profunda&#10;Staging profesional&#10;Checklist digital"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="addons">
                    Add-ons (uno por línea, opcional)
                  </Label>
                  <Textarea
                    id="addons"
                    value={formData.addons}
                    onChange={(e) =>
                      setFormData({ ...formData, addons: e.target.value })
                    }
                    rows={3}
                    placeholder="Lavado de ropa: +$35&#10;Reabastecimiento: +$25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="highlighted"
                      checked={formData.highlighted}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          highlighted: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="highlighted">Plan destacado</Label>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="order">Orden</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value),
                        })
                      }
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`p-6 ${tier.highlighted ? "border-brisa-500 border-2" : ""}`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{tier.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tier.headline}
                  </p>
                </div>
                {tier.highlighted && (
                  <Badge className="bg-brisa-500">Destacado</Badge>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.priceSuffix && (
                    <span className="text-sm text-gray-600">
                      {tier.priceSuffix}
                    </span>
                  )}
                </div>
              </div>

              {tier.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {tier.description}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-semibold">Características:</p>
                <ul className="text-sm space-y-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-brisa-500 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {tier.addons && tier.addons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Add-ons:</p>
                  <ul className="text-sm space-y-1">
                    {tier.addons.map((addon, idx) => (
                      <li
                        key={idx}
                        className="text-gray-600 dark:text-gray-400"
                      >
                        + {addon}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openDialog(tier)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(tier.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {tiers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No hay planes de precios. Crea el primero.
          </div>
        )}
      </div>
    </div>
  );
}
