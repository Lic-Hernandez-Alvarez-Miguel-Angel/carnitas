import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { apiGet, apiPost } from "../services/api";

export default function InventarioView({ navigation }) {
  const [almacenes, setAlmacenes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [historialMovimientos, setHistorialMovimientos] = useState([]);

  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
  const [productoMoviendo, setProductoMoviendo] = useState(null);
  const [cantidadMover, setCantidadMover] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const almacenesData = await apiGet("/almacenes");
      const inventarioData = await apiGet("/inventario");
      const movimientosData = await apiGet("/movimientos");

      setAlmacenes(almacenesData);
      setInventario(inventarioData);
      setHistorialMovimientos(movimientosData);

      if (almacenesData.length > 0 && !almacenSeleccionado) {
        setAlmacenSeleccionado(almacenesData[0]);
      }
    } catch (error) {
      console.log("Error cargando inventario:", error);
      Alert.alert("Error", "No se pudo cargar el inventario.");
    }
  };

  const inventarioFiltrado = inventario.filter(
    (item) => item.almacen_id === almacenSeleccionado?.id
  );

  const obtenerAlmacenDestino = () => {
    return almacenes.find((a) => a.id !== almacenSeleccionado?.id) || null;
  };

  const iniciarMovimiento = (item) => {
    setProductoMoviendo(item);
    setCantidadMover("");
  };

  const cancelarMovimiento = () => {
    setProductoMoviendo(null);
    setCantidadMover("");
  };

  const confirmarMovimiento = async () => {
    if (!productoMoviendo || !almacenSeleccionado) return;

    const almacenDestino = obtenerAlmacenDestino();
    const cantidadNumero = parseFloat(cantidadMover);

    if (!almacenDestino) {
      Alert.alert("Atención", "No existe almacén destino.");
      return;
    }

    if (isNaN(cantidadNumero) || cantidadNumero <= 0) {
      Alert.alert("Atención", "Ingresa una cantidad válida.");
      return;
    }

    if (cantidadNumero > Number(productoMoviendo.cantidad)) {
      Alert.alert(
        "Cantidad no disponible",
        `Solo tienes ${productoMoviendo.cantidad} ${productoMoviendo.unidad_base} disponibles.`
      );
      return;
    }

    try {
      await apiPost("/movimientos", {
        producto_id: productoMoviendo.producto_id,
        almacen_origen_id: almacenSeleccionado.id,
        almacen_destino_id: almacenDestino.id,
        usuario_id: 1,
        cantidad: cantidadNumero,
        unidad: productoMoviendo.unidad_base,
      });

      Alert.alert(
        "Movimiento realizado",
        `Se movieron ${cantidadNumero} ${productoMoviendo.unidad_base} de ${productoMoviendo.producto} a ${almacenDestino.nombre}.`
      );

      cancelarMovimiento();
      cargarDatos();
    } catch (error) {
      console.log("Error realizando movimiento:", error);
      Alert.alert("Error", "No se pudo realizar el movimiento.");
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>📦 Inventario</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Consulta y mueve existencias por almacén.
      </Text>

      <View style={styles.selectorCard}>
        <Text style={styles.label}>Selecciona almacén</Text>

        <View style={styles.rowWrap}>
          {almacenes.map((almacen) => (
            <TouchableOpacity
              key={almacen.id}
              style={[
                styles.chip,
                almacenSeleccionado?.id === almacen.id && styles.chipActive,
              ]}
              onPress={() => {
                setAlmacenSeleccionado(almacen);
                cancelarMovimiento();
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  almacenSeleccionado?.id === almacen.id &&
                    styles.chipTextActive,
                ]}
              >
                {almacen.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Almacén: {almacenSeleccionado?.nombre || "-"}
        </Text>
        <Text style={styles.summaryText}>
          Productos registrados: {inventarioFiltrado.length}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {inventarioFiltrado.length === 0 ? (
          <Text style={styles.empty}>No hay inventario registrado.</Text>
        ) : (
          inventarioFiltrado.map((item) => {
            const destino = obtenerAlmacenDestino();

            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.productName}>{item.producto}</Text>
                <Text style={styles.info}>Categoría: {item.categoria}</Text>
                <Text style={styles.info}>
                  Cantidad disponible: {item.cantidad} {item.unidad_base}
                </Text>
                <Text style={styles.info}>
                  Ubicación: {almacenSeleccionado?.nombre}
                </Text>

                {productoMoviendo?.id === item.id ? (
                  <View style={styles.moveBox}>
                    <Text style={styles.moveTitle}>
                      Mover a {destino?.nombre}
                    </Text>

                    <TextInput
                      style={styles.input}
                      placeholder={`Cantidad en ${item.unidad_base}`}
                      value={cantidadMover}
                      onChangeText={setCantidadMover}
                      keyboardType="numeric"
                    />

                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={confirmarMovimiento}
                    >
                      <Text style={styles.buttonText}>
                        Confirmar movimiento
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelarMovimiento}
                    >
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.moveButton}
                    onPress={() => iniciarMovimiento(item)}
                  >
                    <Text style={styles.buttonText}>
                      Mover a {destino?.nombre}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.section}>Historial de movimientos</Text>

        {historialMovimientos.length === 0 ? (
          <Text style={styles.empty}>Aún no hay movimientos registrados.</Text>
        ) : (
          historialMovimientos.map((mov) => (
            <View key={mov.id} style={styles.historyCard}>
              <Text style={styles.historyTitle}>{mov.producto}</Text>
              <Text style={styles.info}>
                Cantidad: {mov.cantidad} {mov.unidad}
              </Text>
              <Text style={styles.info}>De: {mov.almacen_origen}</Text>
              <Text style={styles.info}>A: {mov.almacen_destino}</Text>
              <Text style={styles.info}>Fecha: {mov.fecha_movimiento}</Text>
            </View>
          ))
        )}
      </ScrollView>
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
  subtitle: {
    color: "#7A6A59",
    fontSize: 15,
    marginBottom: 18,
  },
  selectorCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  label: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 12,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#F5E5C8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: {
    backgroundColor: "#C0392B",
  },
  chipText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
  summaryCard: {
    backgroundColor: "#D35400",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  summaryText: {
    color: "#FFF5E1",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  productName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 8,
  },
  info: {
    color: "#6E5B4B",
    marginBottom: 4,
    fontWeight: "600",
  },
  moveButton: {
    backgroundColor: "#D35400",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  moveBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  moveTitle: {
    color: "#4A1F0F",
    fontWeight: "800",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginTop: 16,
    marginBottom: 12,
  },
  empty: {
    color: "#7A6A59",
    marginBottom: 20,
  },
  historyCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },
});