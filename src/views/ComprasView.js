import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import ScreenWrapper from "../components/ScreenWrapper";
import { apiGet, apiPost } from "../services/api";

export default function ComprasView({ navigation }) {
  const unidades = ["kilos", "litros", "piezas", "cajas", "costales", "manojos", "paquetes"];

  const [almacenes, setAlmacenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);

  const [almacenId, setAlmacenId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [productoTexto, setProductoTexto] = useState("");
  const [unidad, setUnidad] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [total, setTotal] = useState("");
  const [fotoTicket, setFotoTicket] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const almacenesData = await apiGet("/almacenes");
      const productosData = await apiGet("/productos");
      const comprasData = await apiGet("/compras");

      setAlmacenes(almacenesData);
      setProductos(productosData);
      setCompras(comprasData);
    } catch (error) {
      console.log("Error cargando compras:", error);
      Alert.alert("Error", "No se pudieron cargar los datos.");
    }
  };

  const tomarFotoTicket = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert("Permiso requerido", "Necesitas permitir el uso de la cámara.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!resultado.canceled) {
      setFotoTicket(resultado.assets[0].uri);
    }
  };

  const guardarCompra = async () => {
    if (!almacenId || !productoId || !unidad || !cantidad || !total) {
      Alert.alert("Atención", "Completa todos los campos.");
      return;
    }

    try {
      await apiPost("/compras", {
        almacen_id: almacenId,
        producto_id: productoId,
        usuario_id: 1,
        cantidad: parseFloat(cantidad),
        unidad,
        precio_total: parseFloat(total),
        foto_ticket: fotoTicket,
      });

      Alert.alert("Correcto", "Compra registrada correctamente.");

      setAlmacenId("");
      setProductoId("");
      setProductoTexto("");
      setUnidad("");
      setCantidad("");
      setTotal("");
      setFotoTicket(null);

      cargarDatos();
    } catch (error) {
      console.log("Error guardando compra:", error);
      Alert.alert("Error", "No se pudo guardar la compra.");
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoId(producto.id);
    setProductoTexto(producto.nombre);
    setUnidad(producto.unidad_base || "");
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>🛒 Compras</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Almacén</Text>
        <View style={styles.rowWrap}>
          {almacenes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, almacenId === item.id && styles.chipActive]}
              onPress={() => setAlmacenId(item.id)}
            >
              <Text style={[styles.chipText, almacenId === item.id && styles.chipTextActive]}>
                {item.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Producto comprado</Text>
        <View style={styles.rowWrap}>
          {productos.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, productoId === item.id && styles.chipActiveDark]}
              onPress={() => seleccionarProducto(item)}
            >
              <Text style={[styles.chipText, productoId === item.id && styles.chipTextActive]}>
                {item.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Producto seleccionado"
          value={productoTexto}
          editable={false}
        />

        <Text style={styles.label}>Unidad de compra</Text>
        <View style={styles.rowWrap}>
          {unidades.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, unidad === item && styles.chipActive]}
              onPress={() => setUnidad(item)}
            >
              <Text style={[styles.chipText, unidad === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Cantidad comprada</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 5"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Total pagado</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 350"
          value={total}
          onChangeText={setTotal}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.photoButton} onPress={tomarFotoTicket}>
          <Text style={styles.photoButtonText}>Tomar foto del ticket</Text>
        </TouchableOpacity>

        {fotoTicket && <Image source={{ uri: fotoTicket }} style={styles.ticketImage} />}

        <TouchableOpacity style={styles.saveButton} onPress={guardarCompra}>
          <Text style={styles.saveButtonText}>Guardar compra</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Historial de compras</Text>

      {compras.length === 0 ? (
        <Text style={styles.empty}>Aún no hay compras registradas.</Text>
      ) : (
        compras.map((compra) => (
          <View key={compra.id} style={styles.historyCard}>
            <Text style={styles.productName}>{compra.producto}</Text>
            <Text style={styles.info}>Almacén: {compra.almacen}</Text>
            <Text style={styles.info}>
              Cantidad: {compra.cantidad} {compra.unidad}
            </Text>
            <Text style={styles.total}>
              Total: ${parseFloat(compra.precio_total).toFixed(2)}
            </Text>
            <Text style={styles.info}>Fecha: {compra.fecha_compra}</Text>

            {compra.foto_ticket && (
              <Image source={{ uri: compra.foto_ticket }} style={styles.smallImage} />
            )}
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
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: "#D35400",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  photoButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  ticketImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 14,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 12,
  },
  empty: {
    color: "#7A6A59",
  },
  historyCard: {
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
    marginBottom: 6,
  },
  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },
  total: {
    color: "#C0392B",
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 6,
  },
  smallImage: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    marginTop: 10,
  },
});