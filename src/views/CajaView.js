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
  obtenerResumenCaja,
} from "../controllers/cajaController";

export default function CajaView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;

  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [resumenCaja, setResumenCaja] = useState(null);

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

  const formatearDinero = (valor) => {
    return Number(valor || 0).toFixed(2);
  };

  const cargarCaja = async () => {
    try {
      const abierta = await obtenerCajaAbierta();
      const lista = await obtenerHistorialCaja();

      setCajaAbierta(abierta);
      setHistorial(Array.isArray(lista) ? lista : []);

      if (abierta?.id) {
        const resumen = await obtenerResumenCaja(abierta.id);
        setResumenCaja(resumen || null);
      } else {
        setResumenCaja(null);
      }
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

    const efectivoEsperado = Number(resumenCaja?.efectivo_esperado || 0);
    const diferencia = monto - efectivoEsperado;

    Alert.alert(
      "Cerrar caja",
      `¿Deseas cerrar la caja con $${monto.toFixed(
        2
      )}?\n\nEfectivo esperado: $${efectivoEsperado.toFixed(
        2
      )}\nDiferencia: $${diferencia.toFixed(2)}`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar",
          onPress: async () => {
            setLoading(true);

            const observacionFinal =
              observaciones?.trim() ||
              `Cierre de caja. Efectivo esperado: $${efectivoEsperado.toFixed(
                2
              )}. Diferencia: $${diferencia.toFixed(2)}.`;

            const result = await cerrarCaja(cajaAbierta.id, {
              monto_final: monto,
              observaciones: observacionFinal,
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
        Controla la caja del día: monto inicial, ventas en efectivo,
        transferencias, gastos y efectivo esperado.
      </Text>

      {cajaAbierta ? (
        <View style={styles.activeCard}>
          <Text style={styles.cardTitle}>Caja abierta</Text>

          <Text style={styles.infoStrong}>
            Monto inicial: ${formatearDinero(cajaAbierta.monto_inicial)}
          </Text>

          <Text style={styles.info}>
            Responsable: {cajaAbierta.usuario || "Sin responsable"}
          </Text>

          <Text style={styles.info}>
            Fecha apertura: {formatearFecha(cajaAbierta.fecha_apertura)}
          </Text>

          {resumenCaja ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumen de caja</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Caja inicial</Text>
                <Text style={styles.summaryValue}>
                  ${formatearDinero(resumenCaja.monto_inicial)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ventas en efectivo</Text>
                <Text style={styles.summaryValuePositive}>
                  + ${formatearDinero(resumenCaja.ventas_efectivo)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gastos personales</Text>
                <Text style={styles.summaryValueNegative}>
                  - ${formatearDinero(resumenCaja.total_gastos)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelStrong}>
                  Efectivo esperado
                </Text>
                <Text style={styles.summaryValueStrong}>
                  ${formatearDinero(resumenCaja.efectivo_esperado)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ventas por transferencia</Text>
                <Text style={styles.summaryValueTransfer}>
                  ${formatearDinero(resumenCaja.ventas_transferencia)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ingresos totales</Text>
                <Text style={styles.summaryValue}>
                  ${formatearDinero(resumenCaja.ventas_totales)}
                </Text>
              </View>

              <Text style={styles.noteText}>
                Las transferencias son ingresos del negocio, pero no se suman al
                efectivo físico de caja.
              </Text>
            </View>
          ) : null}

          {resumenCaja?.transferencias?.length > 0 ? (
            <View style={styles.transferBox}>
              <Text style={styles.summaryTitle}>Transferencias registradas</Text>

              {resumenCaja.transferencias.map((transferencia) => (
                <View key={transferencia.id} style={styles.transferItem}>
                  <Text style={styles.transferTitle}>
                    {transferencia.folio || `Ticket #${transferencia.id}`}
                  </Text>

                  <Text style={styles.infoStrong}>
                    Monto: ${formatearDinero(transferencia.total)}
                  </Text>

                  <Text style={styles.info}>
                    Fecha pago: {formatearFecha(transferencia.fecha_pago)}
                  </Text>

                  <Text style={styles.info}>
                    Comprobante:{" "}
                    {transferencia.tiene_comprobante ? "Sí" : "No"}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Cerrar caja</Text>

          <TextInput
            style={styles.input}
            placeholder="Monto final físico contado en caja"
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

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={cargarCaja}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>Actualizar resumen</Text>
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
              Inicial: ${formatearDinero(item.monto_inicial)}
            </Text>

            {item.monto_final !== null && item.monto_final !== undefined && (
              <Text style={styles.info}>
                Final: ${formatearDinero(item.monto_final)}
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

  refreshButton: {
    backgroundColor: "#F7E6C4",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5D3B3",
  },

  refreshButtonText: {
    color: "#4A1F0F",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
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

  summaryBox: {
    backgroundColor: "#FFF9F0",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginTop: 12,
    marginBottom: 14,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 10,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  summaryLabel: {
    flex: 1,
    color: "#6E5B4B",
    fontWeight: "700",
  },

  summaryLabelStrong: {
    flex: 1,
    color: "#4A1F0F",
    fontWeight: "900",
    fontSize: 16,
  },

  summaryValue: {
    color: "#4A1F0F",
    fontWeight: "800",
  },

  summaryValuePositive: {
    color: "#1E7D32",
    fontWeight: "900",
  },

  summaryValueNegative: {
    color: "#C0392B",
    fontWeight: "900",
  },

  summaryValueTransfer: {
    color: "#2D5BE3",
    fontWeight: "900",
  },

  summaryValueStrong: {
    color: "#1E7D32",
    fontWeight: "900",
    fontSize: 17,
  },

  divider: {
    height: 1,
    backgroundColor: "#E9D9BF",
    marginVertical: 6,
  },

  noteText: {
    color: "#7A6A59",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    fontStyle: "italic",
  },

  transferBox: {
    backgroundColor: "#EEF3FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#B8C8FF",
    marginBottom: 14,
  },

  transferItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#D7E0FF",
    marginBottom: 8,
  },

  transferTitle: {
    color: "#2D5BE3",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 5,
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
