import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { obtenerTickets } from "../controllers/ticketsController";

export default function ReportesView({ navigation }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      cargarTickets();
    });

    return unsubscribe;
  }, [navigation]);

  const cargarTickets = async () => {
    try {
      const data = await obtenerTickets();
      setTickets(data);
    } catch (error) {
      console.log("Error cargando reportes:", error);
      Alert.alert("Error", "No se pudieron cargar los reportes.");
    }
  };

  const totalVentas = tickets.reduce(
    (acc, t) => acc + (Number(t.total) || 0),
    0
  );

  const ticketsAbiertos = tickets.filter((t) => t.estado === "abierto").length;
  const ticketsCerrados = tickets.filter((t) => t.estado === "cerrado").length;

  const ventasPorZona = useMemo(() => {
    const agrupado = {};

    tickets.forEach((ticket) => {
      const zona =
        ticket.punto_venta ||
        ticket.zona ||
        ticket.almacen ||
        "Sin zona";

      if (!agrupado[zona]) {
        agrupado[zona] = {
          zona,
          total: 0,
          tickets: 0,
          abiertos: 0,
          cerrados: 0,
        };
      }

      agrupado[zona].total += Number(ticket.total) || 0;
      agrupado[zona].tickets += 1;

      if (ticket.estado === "abierto") {
        agrupado[zona].abiertos += 1;
      }

      if (ticket.estado === "cerrado") {
        agrupado[zona].cerrados += 1;
      }
    });

    return Object.values(agrupado);
  }, [tickets]);

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>📊 Reportes</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total vendido</Text>
        <Text style={styles.value}>${totalVentas.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tickets registrados</Text>
        <Text style={styles.value}>{tickets.length}</Text>
      </View>

      <View style={styles.rowCards}>
        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Abiertos</Text>
          <Text style={styles.smallValue}>{ticketsAbiertos}</Text>
        </View>

        <View style={styles.smallCard}>
          <Text style={styles.smallLabel}>Cerrados</Text>
          <Text style={styles.smallValue}>{ticketsCerrados}</Text>
        </View>
      </View>

      <Text style={styles.section}>Ventas por zona</Text>

      {ventasPorZona.length === 0 ? (
        <Text style={styles.empty}>No hay ventas registradas por zona.</Text>
      ) : (
        ventasPorZona.map((zona) => (
          <View key={zona.zona} style={styles.zoneCard}>
            <Text style={styles.zoneTitle}>{zona.zona}</Text>

            <Text style={styles.zoneTotal}>
              Total vendido: ${zona.total.toFixed(2)}
            </Text>

            <Text style={styles.zoneInfo}>
              Tickets registrados: {zona.tickets}
            </Text>

            <Text style={styles.zoneInfo}>
              Abiertos: {zona.abiertos} · Cerrados: {zona.cerrados}
            </Text>
          </View>
        ))
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
    fontSize: 30,
    fontWeight: "800",
    color: "#4A1F0F",
  },
  button: {
    backgroundColor: "#C0392B",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  label: {
    color: "#7A6A59",
    fontSize: 16,
    fontWeight: "700",
  },
  value: {
    color: "#8B0000",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  rowCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  smallLabel: {
    color: "#7A6A59",
    fontSize: 14,
    fontWeight: "700",
  },
  smallValue: {
    color: "#8B0000",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  section: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4A1F0F",
    marginTop: 8,
    marginBottom: 12,
  },
  zoneCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  zoneTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 8,
  },
  zoneTotal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },
  zoneInfo: {
    color: "#6E5B4B",
    fontWeight: "600",
    marginBottom: 4,
  },
  empty: {
    color: "#7A6A59",
  },
});