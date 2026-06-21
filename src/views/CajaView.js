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
  abrirCaja,
  cerrarCaja,
  obtenerCajaAbierta,
  obtenerHistorialCaja,
} from "../controllers/cajaController";

export default function CajaView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;

  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [montoInicial, setMontoInicial] = useState("");
  const [montoFinal, setMontoFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCaja();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    try {
      return new Date(fecha).toLocaleString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  const cargarCaja = async () => {
    try {
      const abierta = await obtenerCajaAbierta();
      const lista = await obtenerHistorialCaja();

      setCajaAbierta(abierta);
      setHistorial(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.log("Error cargarCaja:", error);
      Alert.alert("Error", "No se pudo cargar la información de caja.");
    }
  };

  const handleAbrirCaja = async () => {
    const monto = Number(montoInicial);

    if (montoInicial.trim() === "" || Number.isNaN(monto) || monto < 0) {
      Alert.alert("Atención", "Ingresa un monto inicial válido.");
      return;
    }

    setLoading(true);

    const result = await abrirCaja({
      usuario_id: usuario?.id || null,
      monto_inicial: monto,
      observaciones,
    });

    setLoading(false);

    if (result?.error) {
      Alert.alert("Error", result.error);
      return;
    }

    Alert.alert("Correcto", "Caja abierta correctamente.");
    setMontoInicial("");
    setObservaciones("");
    cargarCaja();
  };

  const handleCerrarCaja = async () => {
    if (!cajaAbierta?.id) return;

    const monto = Number(montoFinal);

    if (montoFinal.trim() === "" || Number.isNaN(monto) || monto < 0) {
      Alert.alert("Atención", "Ingresa un monto final válido.");
      return;
    }

    Alert.alert(
      "Cerrar caja",
      `¿Deseas cerrar la caja con $${monto.toFixed(2)}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar",
          onPress: async () => {
            setLoading(true);

            const result = await cerrarCaja(cajaAbierta.id, {
              monto_final: monto,
              observaciones,
            });

            setLoading(false);

            if (result?.error) {
              Alert.alert("Error", result.error);
              return;
            }

            Alert.alert("Correcto", "Caja cerrada correctamente.");
            setMontoFinal("");
            setObservaciones("");
            cargarCaja();
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>💵 Caja</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Registra con cuánto dinero inicia la caja para dar cambio.
      </Text>

      {cajaAbierta ? (
        <View style={styles.activeCard}>
          <Text style={styles.cardTitle}>Caja abierta</Text>

          <Text style={styles.infoStrong}>
            Monto inicial: $
            {Number(cajaAbierta.monto_inicial || 0).toFixed(2)}
          </Text>

          <Text style={styles.info}>
            Responsable: {cajaAbierta.usuario || "Sin responsable"}
          </Text>

          <Text style={styles.info}>
            Fecha apertura: {formatearFecha(cajaAbierta.fecha_apertura)}
          </Text>

          <Text style={styles.label}>Cerrar caja</Text>

          <TextInput
            style={styles.input}
            placeholder="Monto final al cerrar caja"
            value={montoFinal}
            onChangeText={setMontoFinal}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Observaciones"
            value={observaciones}
            onChangeText={setObservaciones}
          />

          <TouchableOpacity
            style={[styles.closeButton, loading && styles.disabledButton]}
            onPress={handleCerrarCaja}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Procesando..." : "Cerrar caja"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Abrir caja</Text>

          <Text style={styles.label}>Monto inicial</Text>

          <TextInput
            style={styles.input}
            placeholder="¿Con cuánto inicia la caja?"
            value={montoInicial}
            onChangeText={setMontoInicial}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Observaciones</Text>

          <TextInput
            style={styles.input}
            placeholder="Ejemplo: Cambio inicial del día"
            value={observaciones}
            onChangeText={setObservaciones}
          />

          <TouchableOpacity
            style={[styles.openButton, loading && styles.disabledButton]}
            onPress={handleAbrirCaja}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Guardando..." : "Abrir caja"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.section}>Historial</Text>

      {historial.length === 0 ? (
        <Text style={styles.empty}>No hay movimientos de caja.</Text>
      ) : (
        historial.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <Text style={styles.historyTitle}>
              Caja #{item.id} - {item.estado}
            </Text>

            <Text style={styles.info}>
              Inicial: ${Number(item.monto_inicial || 0).toFixed(2)}
            </Text>

            {item.monto_final !== null && item.monto_final !== undefined && (
              <Text style={styles.info}>
                Final: ${Number(item.monto_final || 0).toFixed(2)}
              </Text>
            )}

            <Text style={styles.info}>
              Responsable: {item.usuario || "Sin responsable"}
            </Text>

            <Text style={styles.info}>
              Apertura: {formatearFecha(item.fecha_apertura)}
            </Text>

            {item.fecha_cierre ? (
              <Text style={styles.info}>
                Cierre: {formatearFecha(item.fecha_cierre)}
              </Text>
            ) : null}

            {item.observaciones ? (
              <Text style={styles.observaciones}>
                Observaciones: {item.observaciones}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8EFD8",
    padding: 20,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4A1F0F",
  },

  subtitle: {
    color: "#7A6A59",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },

  backButton: {
    backgroundColor: "#C0392B",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginBottom: 18,
  },

  activeCard: {
    backgroundColor: "#EAF7E9",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFE6B8",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 12,
  },

  label: {
    color: "#4A1F0F",
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },

  openButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },

  closeButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },

  section: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4A1F0F",
    marginTop: 8,
    marginBottom: 12,
  },

  historyCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginBottom: 10,
  },

  historyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },

  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },

  infoStrong: {
    color: "#1E7D32",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  observaciones: {
    color: "#4A1F0F",
    marginTop: 6,
    fontStyle: "italic",
  },

  empty: {
    color: "#7A6A59",
  },
});