import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import {
  obtenerTickets,
  finalizarTicket,
} from "../controllers/ticketsController";
import { apiGet } from "../services/api";

export default function TicketsView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;
  const usuarioId = usuario?.id || route?.params?.usuarioId || null;
  const rol = usuario?.rol || route?.params?.rol || "empleado";

  const [tickets, setTickets] = useState([]);
  const [ticketPagandoId, setTicketPagandoId] = useState(null);
  const [montoPagado, setMontoPagado] = useState("");
  const [zonaAsignada, setZonaAsignada] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      cargarTickets();
    });

    return unsubscribe;
  }, [navigation, usuarioId, rol]);

  const cargarTickets = async () => {
    try {
      if (!usuarioId && rol !== "jefe") {
        Alert.alert("Error", "No se pudo identificar al empleado.");
        return;
      }

      let puntoVentaId = null;

      if (rol !== "jefe") {
        const asignacion = await apiGet(`/asignaciones/usuario/${usuarioId}`);
        setZonaAsignada(asignacion);
        puntoVentaId = asignacion?.punto_venta_id || null;
      }

      const data = await obtenerTickets({
        usuario_id: usuarioId,
        punto_venta_id: puntoVentaId,
        rol,
      });

      setTickets(data);
    } catch (error) {
      console.log("Error cargando tickets:", error);
      Alert.alert("Error", "No se pudieron cargar los tickets.");
    }
  };

  const handleFinalizarTicket = async (ticket) => {
    const pagado = parseFloat(montoPagado);
    const total = Number(ticket.total || 0);

    if (isNaN(pagado) || pagado < total) {
      Alert.alert(
        "Pago insuficiente",
        `El cliente debe pagar mínimo $${total.toFixed(2)}`
      );
      return;
    }

    try {
      const result = await finalizarTicket(ticket.id, {
        metodo_pago: "efectivo",
        monto_pagado: pagado,
      });

      if (result?.error) {
        Alert.alert("Atención", result.error);
        return;
      }

      const cambio = pagado - total;

      Alert.alert(
        "Orden finalizada",
        `Total: $${total.toFixed(2)}\nPagó: $${pagado.toFixed(
          2
        )}\nCambio: $${cambio.toFixed(2)}`
      );

      setTicketPagandoId(null);
      setMontoPagado("");
      cargarTickets();
    } catch (error) {
      Alert.alert("Error", "No se pudo finalizar el ticket.");
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>🧾 Tickets</Text>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() =>
            navigation.navigate(rol === "jefe" ? "Jefe" : "Empleado", {
              usuario,
              usuarioId,
              rol,
            })
          }
        >
          <Text style={styles.homeButtonText}>Inicio</Text>
        </TouchableOpacity>
      </View>

      {rol !== "jefe" && (
        <View style={styles.zoneBox}>
          <Text style={styles.zoneLabel}>Zona asignada</Text>
          <Text style={styles.zoneValue}>
            {zonaAsignada?.punto_venta || "Sin zona asignada"}
          </Text>
        </View>
      )}

      <Text style={styles.section}>Listado</Text>

      {tickets.length === 0 ? (
        <Text style={styles.empty}>No hay tickets registrados.</Text>
      ) : (
        tickets.map((ticket) => {
          const total = Number(ticket.total || 0);
          const pagado = parseFloat(montoPagado || "0");
          const cambio =
            ticketPagandoId === ticket.id ? Math.max(pagado - total, 0) : 0;

          return (
            <View key={ticket.id} style={styles.ticketCard}>
              <Text style={styles.folio}>{ticket.folio}</Text>

              <Text style={styles.info}>
                Zona: {ticket.punto_venta || "Sin zona"}
              </Text>

              <Text style={styles.info}>
                Empleado: {ticket.usuario || "Sin empleado"}
              </Text>

              <Text style={styles.info}>
                Servicio: {ticket.tipo_servicio || ticket.tipoServicio || "-"}
              </Text>

              {ticket.mesa ? (
                <Text style={styles.info}>Mesa: {ticket.mesa}</Text>
              ) : null}

              <Text style={styles.info}>Estado: {ticket.estado}</Text>

              <Text style={styles.info}>
                Fecha: {ticket.fecha_venta || ticket.fecha || "-"}
              </Text>

              {ticket.estado === "cerrado" && (
                <>
                  <Text style={styles.info}>
                    Método pago: {ticket.metodo_pago || "-"}
                  </Text>

                  {ticket.monto_pagado !== null &&
                    ticket.monto_pagado !== undefined && (
                      <Text style={styles.info}>
                        Pagó: ${Number(ticket.monto_pagado || 0).toFixed(2)}
                      </Text>
                    )}

                  {ticket.cambio !== null && ticket.cambio !== undefined && (
                    <Text style={styles.info}>
                      Cambio: ${Number(ticket.cambio || 0).toFixed(2)}
                    </Text>
                  )}
                </>
              )}

              <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>

              <TouchableOpacity
                style={styles.detailButton}
                onPress={() =>
                  navigation.navigate("DetallePedido", {
                    ticketId: ticket.id,
                    usuario,
                    usuarioId,
                    rol,
                  })
                }
              >
                <Text style={styles.detailButtonText}>
                  Ver / agregar productos
                </Text>
              </TouchableOpacity>

              {ticket.estado === "abierto" &&
                (ticketPagandoId === ticket.id ? (
                  <View style={styles.paymentBox}>
                    <Text style={styles.paymentTitle}>Pago en efectivo</Text>

                    <TextInput
                      style={styles.paymentInput}
                      placeholder="¿Con cuánto paga?"
                      value={montoPagado}
                      onChangeText={setMontoPagado}
                      keyboardType="numeric"
                    />

                    <Text style={styles.changeText}>
                      Cambio: ${cambio.toFixed(2)}
                    </Text>

                    <TouchableOpacity
                      style={styles.finishButton}
                      onPress={() => handleFinalizarTicket(ticket)}
                    >
                      <Text style={styles.finishButtonText}>Confirmar pago</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setTicketPagandoId(null);
                        setMontoPagado("");
                      }}
                    >
                      <Text style={styles.finishButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => {
                      setTicketPagandoId(ticket.id);
                      setMontoPagado("");
                    }}
                  >
                    <Text style={styles.finishButtonText}>Finalizar orden</Text>
                  </TouchableOpacity>
                ))}
            </View>
          );
        })
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: "#4A1F0F",
  },
  homeButton: {
    backgroundColor: "#C0392B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 90,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  zoneBox: {
    backgroundColor: "#EAF7E9",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFE6B8",
    marginBottom: 16,
  },
  zoneLabel: {
    color: "#4D6B50",
    fontWeight: "700",
    marginBottom: 4,
  },
  zoneValue: {
    color: "#1E7D32",
    fontSize: 20,
    fontWeight: "800",
  },
  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 12,
    marginTop: 8,
  },
  ticketCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  folio: {
    fontSize: 18,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },
  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },
  total: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
  },
  empty: {
    color: "#7A6A59",
  },
  detailButton: {
    backgroundColor: "#D35400",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  detailButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
  finishButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  finishButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
  paymentBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  paymentTitle: {
    color: "#4A1F0F",
    fontWeight: "800",
    marginBottom: 10,
    fontSize: 16,
  },
  paymentInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },
  changeText: {
    color: "#27AE60",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#7F8C8D",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
});