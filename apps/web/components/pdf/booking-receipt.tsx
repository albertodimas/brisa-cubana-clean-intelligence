import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Booking } from "@/lib/api";

// Registrar fuentes (opcional - podemos usar las default primero)
// Font.register({
//   family: "Inter",
//   src: "/fonts/Inter-Regular.ttf",
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottom: "2 solid #0EA5E9",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0EA5E9",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 10,
    color: "#64748b",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#1e293b",
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#334155",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "bold",
  },
  divider: {
    borderBottom: "1 solid #e2e8f0",
    marginVertical: 15,
  },
  priceSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  priceValue: {
    fontSize: 11,
    color: "#1e293b",
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "2 solid #cbd5e1",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0EA5E9",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#94a3b8",
    paddingTop: 15,
    borderTop: "1 solid #e2e8f0",
  },
  statusBadge: {
    padding: "5 10",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 5,
  },
  statusConfirmed: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusCompleted: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
});

type BookingReceiptProps = {
  booking: Booking;
  generatedAt: string;
};

export function BookingReceipt({ booking, generatedAt }: BookingReceiptProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return styles.statusConfirmed;
      case "PENDING":
        return styles.statusPending;
      case "COMPLETED":
        return styles.statusCompleted;
      case "CANCELLED":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmada";
      case "PENDING":
        return "Pendiente";
      case "COMPLETED":
        return "Completada";
      case "CANCELLED":
        return "Cancelada";
      case "IN_PROGRESS":
        return "En Progreso";
      default:
        return status;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BRISA CUBANA</Text>
          <Text style={styles.tagline}>Servicios de Limpieza Profesional</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Comprobante de Reserva</Text>

        {/* Booking Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Reserva</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Código de Reserva:</Text>
            <Text style={styles.value}>{booking.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <View style={[styles.statusBadge, getStatusStyle(booking.status)]}>
              <Text>{getStatusLabel(booking.status)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Programada:</Text>
            <Text style={styles.value}>{formatDate(booking.scheduledAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{booking.durationMin} minutos</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicio</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre del Servicio:</Text>
            <Text style={styles.value}>{booking.service.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Precio Base:</Text>
            <Text style={styles.value}>
              ${booking.service.basePrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Property Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{booking.property.label}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ubicación:</Text>
            <Text style={styles.value}>{booking.property.city}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer Info */}
        {booking.customer && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cliente</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>
                  {booking.customer.fullName ?? "No especificado"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{booking.customer.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Assigned Staff */}
        {booking.assignedStaff && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Asignado</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Nombre:</Text>
                <Text style={styles.value}>
                  {booking.assignedStaff.fullName ??
                    booking.assignedStaff.email}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Notes */}
        {booking.notes && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.value}>{booking.notes}</Text>
            </View>

            <View style={styles.divider} />
          </>
        )}

        {/* Price Breakdown */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Precio del Servicio:</Text>
            <Text style={styles.priceValue}>
              ${booking.service.basePrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a Pagar:</Text>
            <Text style={styles.totalValue}>
              ${booking.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Brisa Cubana - Servicios de Limpieza Profesional</Text>
          <Text>Email: info@brisacubana.com | Tel: +53 5555-1234</Text>
          <Text style={{ marginTop: 5 }}>
            Comprobante generado el: {generatedAt}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
