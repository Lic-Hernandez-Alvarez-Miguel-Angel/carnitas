import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import {
  obtenerCajaAbierta,
  obtenerGastosCaja,
  crearGastoCaja,
} from "../controllers/cajaController";

export default function GastosView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;

  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [gastos, setGastos] = useState([]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const caja = await obtenerCajaAbierta();
      setCajaAbierta(caja);

      if (caja?.id) {
        const lista = await obtenerGastosCaja(caja.id);
        setGastos(lista);
      } else {
        setGastos([]);
      }
    } catch (error) {
      console.log("Error cargar gastos:", error);
      Alert.alert("Error", "No se pudieron cargar los gastos.");
    }
  };

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

  const handleGuardarGasto = async () => {
    const montoNumero = Number(monto);

    if (!cajaAbierta?.id) {
      Alert.alert("Sin caja abierta", "Primero debes abrir una caja.");
      return;
    }

    if (!concepto.trim()) {
      Alert.alert("Atención", "Escribe el concepto del gasto.");
      return;
    }

    if (!monto.trim() || Number.isNaN(montoNumero) || montoNumero <= 0) {
      Alert.alert("Atención", "Ingresa un monto válido.");
      return;
    }

    setGuardando(true);

    const result = await crearGastoCaja({
      caja_id: cajaAbierta.id,
      usuario_id: usuario?.id || null,
      concepto,
      categoria: "personal",
      monto: montoNumero,
      observaciones,
    });

    setGuardando(false);

    if (result?.error) {
      Alert.alert("Error", result.error);
      return;
    }

    Alert.alert("Correcto", "Gasto registrado correctamente.");
    setConcepto("");
    setMonto("");
    setObservaciones("");
    cargarDatos();
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>💸 Gastos</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      {!cajaAbierta ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>No hay caja abierta</Text>
          <Text style={styles.info}>
            Para registrar gastos primero debes abrir una caja.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registrar gasto personal</Text>

            <Text style={styles.label}>Concepto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Comida, pasaje, compra personal"
              value={concepto}
              onChangeText={setConcepto}
            />

            <Text style={styles.label}>Monto</Text>
            <TextInput
              style={styles.input}
              placeholder="Monto del gasto"
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Observaciones</Text>
            <TextInput
              style={styles.input}
              placeholder="Opcional"
              value={observaciones}
              onChangeText={setObservaciones}
            />

            <TouchableOpacity
              style={[styles.saveButton, guardando && styles.disabledButton]}
              onPress={handleGuardarGasto}
              disabled={guardando}
            >
              <Text style={styles.buttonText}>
                {guardando ? "Guardando..." : "Guardar gasto"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Gastos registrados</Text>

          {gastos.length === 0 ? (
            <Text style={styles.empty}>No hay gastos registrados.</Text>
          ) : (
            gastos.map((gasto) => (
              <View key={gasto.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>{gasto.concepto}</Text>

                <Text style={styles.infoStrong}>
                  Monto: ${Number(gasto.monto || 0).toFixed(2)}
                </Text>

                <Text style={styles.info}>
                  Fecha: {formatearFecha(gasto.fecha_gasto)}
                </Text>

                <Text style={styles.info}>
                  Usuario: {gasto.usuario || "Sin usuario"}
                </Text>

                {gasto.observaciones ? (
                  <Text style={styles.observaciones}>
                    Observaciones: {gasto.observaciones}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </>
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

  warningCard: {
    backgroundColor: "#FFF4D7",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0B84D",
    marginBottom: 18,
  },

  warningTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#8B5E00",
    marginBottom: 8,
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

  saveButton: {
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