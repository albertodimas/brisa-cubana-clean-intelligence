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
import { Check, X, Plus, Pencil, Trash2 } from "lucide-react";

type TestimonialStatus = "PENDING" | "APPROVED" | "REJECTED";

type Testimonial = {
  id: string;
  author: string;
  role: string;
  quote: string;
  status: TestimonialStatus;
  order: number;
  isActive: boolean;
};

export function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    author: "",
    role: "",
    quote: "",
    status: "PENDING" as TestimonialStatus,
    order: 0,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    try {
      setLoading(true);
      const response = await fetch("/api/marketing/testimonials?showAll=true");
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.data);
      }
    } catch (error) {
      console.error("Error loading testimonials:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingTestimonial
      ? `/api/marketing/testimonials/${editingTestimonial.id}`
      : "/api/marketing/testimonials";

    const method = editingTestimonial ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTestimonials();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving testimonial:", error);
    }
  }

  async function handleStatusChange(id: string, status: TestimonialStatus) {
    try {
      const response = await fetch(`/api/marketing/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await loadTestimonials();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este testimonio?")) return;

    try {
      const response = await fetch(`/api/marketing/testimonials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadTestimonials();
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  }

  function openDialog(testimonial?: Testimonial) {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setFormData({
        author: testimonial.author,
        role: testimonial.role,
        quote: testimonial.quote,
        status: testimonial.status,
        order: testimonial.order,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingTestimonial(null);
    setFormData({
      author: "",
      role: "",
      quote: "",
      status: "PENDING",
      order: 0,
    });
  }

  const statusColors = {
    PENDING:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    APPROVED:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Testimonios</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Testimonio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTestimonial ? "Editar" : "Nuevo"} Testimonio
                </DialogTitle>
                <DialogDescription>
                  Completa los datos del testimonio
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Rol / Empresa</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quote">Testimonio</Label>
                  <Textarea
                    id="quote"
                    value={formData.quote}
                    onChange={(e) =>
                      setFormData({ ...formData, quote: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as TestimonialStatus,
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-brisa-600/50 bg-brisa-800/80 px-3 py-2 text-sm text-brisa-200 ring-offset-brisa-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="APPROVED">Aprobado</option>
                      <option value="REJECTED">Rechazado</option>
                    </select>
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

      <div className="grid gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">
                    {testimonial.author}
                  </h3>
                  <Badge className={statusColors[testimonial.status]}>
                    {testimonial.status === "PENDING" && "Pendiente"}
                    {testimonial.status === "APPROVED" && "Aprobado"}
                    {testimonial.status === "REJECTED" && "Rechazado"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Orden: {testimonial.order}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {testimonial.role}
                </p>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{testimonial.quote}"
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {testimonial.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() =>
                        handleStatusChange(testimonial.id, "APPROVED")
                      }
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() =>
                        handleStatusChange(testimonial.id, "REJECTED")
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDialog(testimonial)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(testimonial.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {testimonials.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay testimonios. Crea el primero.
          </div>
        )}
      </div>
    </div>
  );
}
