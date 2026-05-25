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
import {
  obtenerProductos,
  construirItemTicket,
  calcularImporteItem,
  calcularTotalTicket,
} from "../controllers/ventasController";
import {
  crearTicket,
  agregarItemsATicketMesa,
  buscarTicketPorMesa,
} from "../controllers/ticketsController";
import { apiGet } from "../services/api";

export default function VentasView({ navigation, route }) {
const usuario = route?.params?.usuario || null;
const usuarioId = usuario?.id || route?.params?.usuarioId || null;

  const [productos, setProductos] = useState([]);
  const [zonaAsignada, setZonaAsignada] = useState(null);

  const [tipoServicio, setTipoServicio] = useState("llevar");
  const [mesa, setMesa] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoVenta, setModoVenta] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [itemsTicket, setItemsTicket] = useState([]);
  const [combinacionTaco, setCombinacionTaco] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("carnitas");
  const [guardando, setGuardando] = useState(false);

  const categorias = ["carnitas", "refrescos", "bebidas", "alcohol"];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const productosData = await obtenerProductos();
      const asignacion = await apiGet(`/asignaciones/usuario/${usuarioId}`);

      setProductos(productosData);
      setZonaAsignada(asignacion);
    } catch (error) {
      console.log("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos.");
    }
  };

  const normalizarCategoria = (valor) =>
    String(valor || "").trim().toLowerCase();

  const productosFiltrados = productos.filter(
    (p) => normalizarCategoria(p.categoria) === categoriaActiva
  );

  const importeActual = useMemo(() => {
    if (!modoVenta) return 0;

    if (modoVenta === "taco" && combinacionTaco.length > 0) {
      return calcularImporteItem(
        null,
        modoVenta,
        parseFloat(cantidad) || 0,
        combinacionTaco
      );
    }

    if (!productoSeleccionado) return 0;

    return calcularImporteItem(
      productoSeleccionado,
      modoVenta,
      parseFloat(cantidad) || 0,
      []
    );
  }, [productoSeleccionado, modoVenta, cantidad, combinacionTaco]);

  const totalTicket = useMemo(() => {
    return calcularTotalTicket(itemsTicket);
  }, [itemsTicket]);

  const limpiarSeleccionProducto = () => {
    setProductoSeleccionado(null);
    setModoVenta("");
    setCantidad("1");
    setCombinacionTaco([]);
  };

  const limpiarTicket = () => {
    setItemsTicket([]);
    setMesa("");
    limpiarSeleccionProducto();
  };

  const handleSeleccionProducto = (producto) => {
    setProductoSeleccionado(producto);
    setModoVenta(producto.tipoVenta?.[0] || "");
    setCantidad("1");
    setCombinacionTaco([]);
  };

  const toggleCombinacion = (producto) => {
    const existe = combinacionTaco.some((p) => p.id === producto.id);

    if (existe) {
      setCombinacionTaco((prev) => prev.filter((p) => p.id !== producto.id));
    } else {
      setCombinacionTaco((prev) => [...prev, producto]);
    }
  };

  const handleAgregarItem = () => {
    if (!modoVenta) {
      Alert.alert("Atención", "Selecciona un tipo de venta.");
      return;
    }

    if (!cantidad || parseFloat(cantidad) <= 0) {
      Alert.alert("Atención", "Ingresa una cantidad válida.");
      return;
    }

    if (modoVenta === "taco" && combinacionTaco.length > 0) {
      const item = construirItemTicket(
        null,
        modoVenta,
        cantidad,
        combinacionTaco
      );

      setItemsTicket((prev) => [...prev, item]);
      limpiarSeleccionProducto();
      return;
    }

    if (!productoSeleccionado) {
      Alert.alert("Atención", "Selecciona un producto.");
      return;
    }

    const item = construirItemTicket(
      productoSeleccionado,
      modoVenta,
      cantidad,
      []
    );

    setItemsTicket((prev) => [...prev, item]);
    limpiarSeleccionProducto();
  };

  const handleGuardarTicket = async () => {
    if (!zonaAsignada?.punto_venta_id) {
      Alert.alert(
        "Sin zona asignada",
        "Este empleado no tiene un punto de venta asignado. El jefe debe asignarle una zona."
      );
      return;
    }

    if (itemsTicket.length === 0) {
      Alert.alert("Atención", "Agrega productos al ticket.");
      return;
    }

    if (tipoServicio === "mesa" && !mesa.trim()) {
      Alert.alert("Atención", "Ingresa el número de mesa.");
      return;
    }

    try {
      setGuardando(true);

      if (tipoServicio === "mesa") {
        const ticketExistente = await buscarTicketPorMesa(mesa.trim());

        if (ticketExistente) {
          const result = await agregarItemsATicketMesa(
            mesa.trim(),
            itemsTicket
          );

          if (result?.error) {
            Alert.alert("Atención", result.error);
            return;
          }

          Alert.alert(
            "Consumo actualizado",
            `Se agregó consumo a la mesa ${mesa.trim()}.`
          );
        } else {
         const result = await crearTicket({
  tipoServicio: "mesa",
  mesa: mesa.trim(),
  punto_venta_id: zonaAsignada.punto_venta_id,
  usuario_id: usuarioId,
  items: itemsTicket,
});

          if (result?.error) {
            Alert.alert("Atención", result.error);
            return;
          }

          Alert.alert(
            "Ticket creado",
            `Se abrió consumo para la mesa ${mesa.trim()} en ${zonaAsignada.punto_venta}.`
          );
        }
      } else {
        const result = await crearTicket({
  tipoServicio: "llevar",
  mesa: "",
  punto_venta_id: zonaAsignada.punto_venta_id,
  usuario_id: usuarioId,
  items: itemsTicket,
});

        if (result?.error) {
          Alert.alert("Atención", result.error);
          return;
        }

        Alert.alert(
          "Ticket guardado",
          `La venta para llevar fue registrada en ${zonaAsignada.punto_venta}.`
        );
      }

      limpiarTicket();
    } catch (error) {
      console.log("Error guardando ticket:", error);
      Alert.alert("Error", "No se pudo guardar el ticket.");
    } finally {
      setGuardando(false);
    }
  };

const handleVerTickets = () => {
  navigation.navigate("Tickets", {
    usuario,
    usuarioId,
    rol: usuario?.rol || "empleado",
  });
};

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <Text style={styles.title}>🍖 Punto de Venta</Text>
      <Text style={styles.subtitle}>
        Arma tickets, controla mesas y registra consumo por zona.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Punto de venta asignado</Text>

        {zonaAsignada ? (
          <View style={styles.zoneBox}>
            <Text style={styles.zoneText}>{zonaAsignada.punto_venta}</Text>
            <Text style={styles.zoneSubText}>
              Empleado: {zonaAsignada.empleado}
            </Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Este empleado no tiene zona asignada.
            </Text>
            <Text style={styles.warningSubText}>
              El jefe debe asignarle una zona desde Gestión de Empleados.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de servicio</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.chip,
              tipoServicio === "llevar" && styles.chipActive,
            ]}
            onPress={() => setTipoServicio("llevar")}
          >
            <Text
              style={[
                styles.chipText,
                tipoServicio === "llevar" && styles.chipTextActive,
              ]}
            >
              Para llevar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, tipoServicio === "mesa" && styles.chipActive]}
            onPress={() => setTipoServicio("mesa")}
          >
            <Text
              style={[
                styles.chipText,
                tipoServicio === "mesa" && styles.chipTextActive,
              ]}
            >
              Comer aquí
            </Text>
          </TouchableOpacity>
        </View>

        {tipoServicio === "mesa" && (
          <>
            <Text style={styles.label}>Número de mesa</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. 5"
              value={mesa}
              onChangeText={setMesa}
              keyboardType="numeric"
            />
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Categorías</Text>

        <View style={styles.rowWrap}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                categoriaActiva === cat && styles.chipActive,
              ]}
              onPress={() => {
                setCategoriaActiva(cat);
                limpiarSeleccionProducto();
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  categoriaActiva === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Productos</Text>

        <View style={styles.rowWrap}>
          {productosFiltrados.map((producto) => {
            const activo = productoSeleccionado?.id === producto.id;

            return (
              <TouchableOpacity
                key={producto.id}
                style={[
                  styles.productButton,
                  activo && styles.productButtonActive,
                ]}
                onPress={() => handleSeleccionProducto(producto)}
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

        {productoSeleccionado && (
          <>
            <Text style={styles.label}>Modo de venta</Text>

            <View style={styles.rowWrap}>
              {productoSeleccionado.tipoVenta?.map((modo) => (
                <TouchableOpacity
                  key={modo}
                  style={[
                    styles.chip,
                    modoVenta === modo && styles.chipActiveDark,
                  ]}
                  onPress={() => setModoVenta(modo)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      modoVenta === modo && styles.chipTextActive,
                    ]}
                  >
                    {modo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {modoVenta === "taco" && categoriaActiva === "carnitas" && (
          <>
            <Text style={styles.label}>Combinación de taco</Text>

            <View style={styles.rowWrap}>
              {productos
                .filter((p) => normalizarCategoria(p.categoria) === "carnitas")
                .map((producto) => {
                  const activo = combinacionTaco.some(
                    (p) => p.id === producto.id
                  );

                  return (
                    <TouchableOpacity
                      key={producto.id}
                      style={[styles.chip, activo && styles.chipActiveDark]}
                      onPress={() => toggleCombinacion(producto)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          activo && styles.chipTextActive,
                        ]}
                      >
                        {producto.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </>
        )}

        <Text style={styles.label}>Cantidad</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresa cantidad"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Producto seleccionado</Text>

          <Text style={styles.previewText}>
            Nombre:{" "}
            {modoVenta === "taco" && combinacionTaco.length > 0
              ? combinacionTaco.map((p) => p.nombre).join(" + ")
              : productoSeleccionado?.nombre || "-"}
          </Text>

          <Text style={styles.previewText}>Modo: {modoVenta || "-"}</Text>
          <Text style={styles.previewText}>Cantidad: {cantidad}</Text>

          <Text style={styles.previewPrice}>
            Importe: ${importeActual.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAgregarItem}>
          <Text style={styles.addButtonText}>Agregar al ticket</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ticket actual</Text>

        {itemsTicket.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay productos agregados.</Text>
        ) : (
          itemsTicket.map((item, index) => (
            <View key={item.itemId || index} style={styles.ticketItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketItemName}>{item.nombre}</Text>
                <Text style={styles.ticketItemDetail}>
                  {item.modoVenta} · {item.cantidad}
                </Text>
              </View>

              <Text style={styles.ticketItemPrice}>
                ${item.importe.toFixed(2)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.total}>Total actual: ${totalTicket.toFixed(2)}</Text>

        <TouchableOpacity
          style={[styles.saveButton, guardando && styles.buttonDisabled]}
          onPress={handleGuardarTicket}
          disabled={guardando}
        >
          <Text style={styles.saveButtonText}>
            {guardando ? "Guardando..." : "Guardar ticket"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleVerTickets}
        >
          <Text style={styles.secondaryButtonText}>Ver tickets guardados</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 6,
  },
  subtitle: {
    color: "#7A6A59",
    marginBottom: 20,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A1F0F",
    marginBottom: 10,
  },
  zoneBox: {
    backgroundColor: "#EAF7E9",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFE6B8",
  },
  zoneText: {
    color: "#1E7D32",
    fontWeight: "800",
    fontSize: 22,
    marginBottom: 4,
  },
  zoneSubText: {
    color: "#4D6B50",
    fontWeight: "700",
  },
  warningBox: {
    backgroundColor: "#FDEDEC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F5B7B1",
  },
  warningText: {
    color: "#C0392B",
    fontWeight: "800",
    fontSize: 17,
    marginBottom: 4,
  },
  warningSubText: {
    color: "#8B0000",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#F5E5C8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: "#C0392B" },
  chipActiveDark: { backgroundColor: "#8B0000" },
  chipText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  chipTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
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
    backgroundColor: "#C0392B",
    borderColor: "#C0392B",
  },
  productButtonText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  productButtonTextActive: { color: "#fff" },
  previewBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 14,
  },
  previewTitle: {
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 6,
  },
  previewText: {
    color: "#6E5B4B",
    marginBottom: 4,
  },
  previewPrice: {
    color: "#C0392B",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
  },
  addButton: {
    backgroundColor: "#D35400",
    paddingVertical: 14,
    borderRadius: 16,
  },
  addButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyText: {
    color: "#7A6A59",
    marginBottom: 10,
  },
  ticketItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1E2C8",
  },
  ticketItemName: {
    fontWeight: "700",
    color: "#4A1F0F",
  },
  ticketItemDetail: {
    color: "#7A6A59",
    marginTop: 3,
  },
  ticketItemPrice: {
    color: "#C0392B",
    fontWeight: "800",
  },
  total: {
    fontSize: 24,
    fontWeight: "800",
    color: "#8B0000",
    marginTop: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#C0392B",
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 17,
  },
  secondaryButton: {
    backgroundColor: "#F5E5C8",
    paddingVertical: 14,
    borderRadius: 16,
  },
  secondaryButtonText: {
    textAlign: "center",
    color: "#4A1F0F",
    fontWeight: "700",
  },
});