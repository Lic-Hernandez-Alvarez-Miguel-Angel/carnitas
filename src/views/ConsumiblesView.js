import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { apiGet } from "../services/api";
import {
  obtenerPuntosVenta,
  registrarSalidaConsumible,
  registrarSobraConsumible,
} from "../controllers/consumiblesController";

export default function ConsumiblesView({ navigation }) {
  const [modo, setModo] = useState("salida");
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [puntoVentaId, setPuntoVentaId] = useState("");
  const [almacenId, setAlmacenId] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const puntos = await obtenerPuntosVenta();
      const almacenesData = await apiGet("/almacenes");
      const productosData = await apiGet("/productos");

      setPuntosVenta(puntos);
      setAlmacenes(almacenesData);
      setProductos(productosData);
    } catch (error) {
      console.log("Error cargando consumibles:", error);
      Alert.alert("Error", "No se pudieron cargar los datos.");
    }
  };

  const productosConsumibles = useMemo(() => {
    return productos.filter((p) => {
      const categoria = String(p.categoria || "").trim().toLowerCase();

      return [
        "carnitas",
        "verduras",
        "insumos",
        "refrescos",
        "bebidas",
        "desechables",
        "alcohol",
      ].includes(categoria);
    });
  }, [productos]);

  const limpiar = () => {
    setProductosSeleccionados([]);
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    limpiar();
  };

  const productoEstaSeleccionado = (productoId) => {
    return productosSeleccionados.some((item) => item.id === productoId);
  };

  const toggleProducto = (producto) => {
    const existe = productoEstaSeleccionado(producto.id);

    if (existe) {
      setProductosSeleccionados((prev) =>
        prev.filter((item) => item.id !== producto.id)
      );
      return;
    }

    setProductosSeleccionados((prev) => [
      ...prev,
      {
        ...producto,
        cantidad: "",
      },
    ]);
  };

  const actualizarCantidad = (productoId, cantidad) => {
    setProductosSeleccionados((prev) =>
      prev.map((item) =>
        item.id === productoId
          ? {
              ...item,
              cantidad,
            }
          : item
      )
    );
  };

  const quitarProducto = (productoId) => {
    setProductosSeleccionados((prev) =>
      prev.filter((item) => item.id !== productoId)
    );
  };

  const guardar = async () => {
    if (!puntoVentaId || !almacenId) {
      Alert.alert("Atención", "Selecciona punto de venta y almacén.");
      return;
    }

    if (productosSeleccionados.length === 0) {
      Alert.alert("Atención", "Selecciona al menos un producto.");
      return;
    }

    const productosInvalidos = productosSeleccionados.filter((item) => {
      const cantidadNumero = parseFloat(item.cantidad);
      return isNaN(cantidadNumero) || cantidadNumero <= 0;
    });

    if (productosInvalidos.length > 0) {
      Alert.alert("Atención", "Todos los productos deben tener cantidad válida.");
      return;
    }

    try {
      for (const item of productosSeleccionados) {
        const payload = {
          punto_venta_id: puntoVentaId,
          almacen_id: almacenId,
          producto_id: item.id,
          usuario_id: 1,
          cantidad: parseFloat(item.cantidad),
          unidad: item.unidad_base || "unidad",
        };

        const result =
          modo === "salida"
            ? await registrarSalidaConsumible(payload)
            : await registrarSobraConsumible(payload);

        if (result?.error) {
          Alert.alert("Error", `${item.nombre}: ${result.error}`);
          return;
        }
      }

      Alert.alert(
        "Correcto",
        modo === "salida"
          ? "Consumibles descontados del almacén."
          : "Sobras regresadas al almacén."
      );

      limpiar();
    } catch (error) {
      console.log("Error guardando consumibles:", error);
      Alert.alert("Error", "No se pudo guardar el movimiento.");
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>🥬 Consumibles</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Selecciona el punto de venta, almacén y varios productos para salida o
        sobra.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de movimiento</Text>

        <View style={styles.rowWrap}>
          <TouchableOpacity
            style={[styles.chip, modo === "salida" && styles.chipActive]}
            onPress={() => cambiarModo("salida")}
          >
            <Text
              style={[
                styles.chipText,
                modo === "salida" && styles.chipTextActive,
              ]}
            >
              Tomar del almacén
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, modo === "sobra" && styles.chipActiveDark]}
            onPress={() => cambiarModo("sobra")}
          >
            <Text
              style={[
                styles.chipText,
                modo === "sobra" && styles.chipTextActive,
              ]}
            >
              Sobra
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Punto de venta</Text>

        <View style={styles.rowWrap}>
          {puntosVenta.map((punto) => (
            <TouchableOpacity
              key={punto.id}
              style={[
                styles.chip,
                puntoVentaId === punto.id && styles.chipActive,
              ]}
              onPress={() => setPuntoVentaId(punto.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  puntoVentaId === punto.id && styles.chipTextActive,
                ]}
              >
                {punto.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          {modo === "salida"
            ? "Almacén de donde se toma"
            : "Almacén al que regresa"}
        </Text>

        <View style={styles.rowWrap}>
          {almacenes.map((almacen) => (
            <TouchableOpacity
              key={almacen.id}
              style={[
                styles.chip,
                almacenId === almacen.id && styles.chipActive,
              ]}
              onPress={() => setAlmacenId(almacen.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  almacenId === almacen.id && styles.chipTextActive,
                ]}
              >
                {almacen.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Selecciona productos</Text>

        <View style={styles.rowWrap}>
          {productosConsumibles.map((producto) => {
            const activo = productoEstaSeleccionado(producto.id);

            return (
              <TouchableOpacity
                key={producto.id}
                style={[
                  styles.productButton,
                  activo && styles.productButtonActive,
                ]}
                onPress={() => toggleProducto(producto)}
              >
                <Text
                  style={[
                    styles.productButtonText,
                    activo && styles.productButtonTextActive,
                  ]}
                >
                  {producto.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Productos seleccionados</Text>

        {productosSeleccionados.length === 0 ? (
          <Text style={styles.empty}>
            Aún no has seleccionado productos.
          </Text>
        ) : (
          productosSeleccionados.map((item) => (
            <View key={item.id} style={styles.selectedItem}>
              <View style={styles.selectedHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedTitle}>{item.nombre}</Text>
                  <Text style={styles.info}>Unidad: {item.unidad_base}</Text>
                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => quitarProducto(item.id)}
                >
                  <Text style={styles.removeButtonText}>Quitar</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder={`Cantidad en ${item.unidad_base || "unidad"}`}
                value={item.cantidad}
                onChangeText={(value) => actualizarCantidad(item.id, value)}
                keyboardType="numeric"
              />
            </View>
          ))
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            productosSeleccionados.length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={guardar}
          disabled={productosSeleccionados.length === 0}
        >
          <Text style={styles.saveButtonText}>
            {modo === "salida"
              ? "Guardar salida de consumibles"
              : "Guardar sobra de consumibles"}
          </Text>
        </TouchableOpacity>
      </View>
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
  subtitle: {
    color: "#7A6A59",
    fontSize: 15,
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
    marginBottom: 10,
    marginTop: 8,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#F5E5C8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#C0392B",
  },
  chipActiveDark: {
    backgroundColor: "#8B0000",
  },
  chipText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
  productButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5D3B3",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  productButtonActive: {
    backgroundColor: "#D35400",
    borderColor: "#D35400",
  },
  productButtonText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  productButtonTextActive: {
    color: "#fff",
  },
  selectedItem: {
    backgroundColor: "#FDF1E0",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedTitle: {
    color: "#8B0000",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 4,
  },
  info: {
    color: "#6E5B4B",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
  },
  empty: {
    color: "#7A6A59",
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  saveButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 14,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
});