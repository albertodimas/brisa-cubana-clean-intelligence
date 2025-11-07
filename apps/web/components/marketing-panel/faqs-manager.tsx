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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

export function FAQsManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    order: 0,
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  async function loadFAQs() {
    try {
      setLoading(true);
      const response = await fetch("/api/marketing/faqs?showAll=true");
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.data);
      }
    } catch (error) {
      console.error("Error loading FAQs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingFAQ
      ? `/api/marketing/faqs/${editingFAQ.id}`
      : "/api/marketing/faqs";

    const method = editingFAQ ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadFAQs();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving FAQ:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este FAQ?")) return;

    try {
      const response = await fetch(`/api/marketing/faqs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadFAQs();
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  }

  async function handleReorder(id: string, newOrder: number) {
    try {
      const response = await fetch(`/api/marketing/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder }),
      });

      if (response.ok) {
        await loadFAQs();
      }
    } catch (error) {
      console.error("Error reordering FAQ:", error);
    }
  }

  function openDialog(faq?: FAQ) {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingFAQ(null);
    setFormData({
      question: "",
      answer: "",
      order: faqs.length,
    });
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingFAQ ? "Editar" : "Nueva"} Pregunta Frecuente
                </DialogTitle>
                <DialogDescription>
                  Completa los datos del FAQ
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="question">Pregunta</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="answer">Respuesta</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    rows={5}
                    required
                  />
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
        {faqs.map((faq, index) => (
          <Card key={faq.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    #{faq.order}
                  </span>
                  <h3 className="font-semibold text-lg">{faq.question}</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {faq.answer}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {index > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReorder(faq.id, faq.order - 1)}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                )}
                {index < faqs.length - 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReorder(faq.id, faq.order + 1)}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDialog(faq)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(faq.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {faqs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay preguntas frecuentes. Crea la primera.
          </div>
        )}
      </div>
    </div>
  );
}
