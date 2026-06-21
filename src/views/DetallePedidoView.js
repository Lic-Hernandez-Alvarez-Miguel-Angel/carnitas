import React, { useEffect, useMemo, useState } from "react";
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
  obtenerTicketPorId,
  agregarItemsATicket,
  marcarItemEntregado,
  cancelarItemTicket,
} from "../controllers/ticketsController";
import {
  obtenerProductos,
  construirItemTicket,
  calcularImporteItem,
} from "../controllers/ventasController";

export default function DetallePedidoView({ navigation, route }) {
  const { ticketId } = route.params;

  const [ticket, setTicket] = useState(null);
  const [productos, setProductos] = useState([]);

  const [categoriaActiva, setCategoriaActiva] = useState("carnitas");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modoVenta, setModoVenta] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [combinacionTaco, setCombinacionTaco] = useState([]);

  const categorias = ["carnitas", "refrescos", "bebidas", "alcohol"];

  useEffect(() => {
    cargarDatos();
  }, []);

  const normalizarCategoria = (valor) =>
    String(valor || "").trim().toLowerCase();

  const cargarDatos = async () => {
    try {
      const ticketData = await obtenerTicketPorId(ticketId);
      const productosData = await obtenerProductos();

      setTicket(ticketData);
      setProductos(productosData);
    } catch (error) {
      console.log("Error cargando detalle:", error);
      Alert.alert("Error", "No se pudo cargar el pedido.");
    }
  };

  const productosFiltrados = productos.filter(
    (p) => normalizarCategoria(p.categoria) === categoriaActiva
  );

  const pendientes = useMemo(() => {
    if (!ticket?.items) return [];
    return ticket.items.filter((i) => i.estado_item === "pendiente");
  }, [ticket]);

  const entregados = useMemo(() => {
    if (!ticket?.items) return [];
    return ticket.items.filter((i) => i.estado_item === "entregado");
  }, [ticket]);
const cancelados = useMemo(() => {
  if (!ticket?.items) return [];
  return ticket.items.filter((i) => i.estado_item === "cancelado");
}, [ticket]);
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

  const limpiarFormulario = () => {
    setProductoSeleccionado(null);
    setModoVenta("");
    setCantidad("1");
    setCombinacionTaco([]);
  };

  const seleccionarProducto = (producto) => {
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

  const agregarProducto = async () => {
    if (!ticket) return;

    if (ticket.estado !== "abierto") {
      Alert.alert("Atención", "Este pedido ya está cerrado.");
      return;
    }

    if (!modoVenta) {
      Alert.alert("Atención", "Selecciona el tipo de venta.");
      return;
    }

    if (!cantidad || parseFloat(cantidad) <= 0) {
      Alert.alert("Atención", "Ingresa una cantidad válida.");
      return;
    }

    let item;

    if (modoVenta === "taco" && combinacionTaco.length > 0) {
      item = construirItemTicket(null, modoVenta, cantidad, combinacionTaco);
    } else {
      if (!productoSeleccionado) {
        Alert.alert("Atención", "Selecciona un producto.");
        return;
      }

      item = construirItemTicket(productoSeleccionado, modoVenta, cantidad, []);
    }

    const result = await agregarItemsATicket(ticket.id, [item]);

    if (result?.error) {
      Alert.alert("Error", result.error);
      return;
    }

    Alert.alert("Correcto", "Producto agregado como pendiente.");
    limpiarFormulario();
    cargarDatos();
  };

  const entregarProducto = async (itemId) => {
    const result = await marcarItemEntregado(ticket.id, itemId);

    if (result?.error) {
      Alert.alert("Error", result.error);
      return;
    }

    Alert.alert("Entregado", "Producto marcado como entregado.");
    cargarDatos();
  };
const cancelarProducto = async (item) => {
  Alert.alert(
    "Cancelar producto",
    `¿Seguro que deseas cancelar ${item.nombre_producto}?\n\nSe descontará $${Number(
      item.subtotal || 0
    ).toFixed(2)} del total del ticket.`,
    [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: async () => {
          const result = await cancelarItemTicket(ticket.id, item.id);

          if (result?.error) {
            Alert.alert("Error", result.error);
            return;
          }

          Alert.alert("Cancelado", "Producto cancelado correctamente.");
          cargarDatos();
        },
      },
    ]
  );
};
  if (!ticket) {
    return (
      <ScreenWrapper contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cargando pedido...</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>🧾 Pedido</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.folio}>{ticket.folio}</Text>
        <Text style={styles.info}>Servicio: {ticket.tipo_servicio}</Text>
        {ticket.mesa ? <Text style={styles.info}>Mesa: {ticket.mesa}</Text> : null}
        <Text style={styles.info}>Estado: {ticket.estado}</Text>
        <Text style={styles.total}>
          Total: ${Number(ticket.total || 0).toFixed(2)}
        </Text>
      </View>

      <Text style={styles.section}>Pendientes</Text>

      {pendientes.length === 0 ? (
        <Text style={styles.empty}>No hay productos pendientes.</Text>
      ) : (
        pendientes.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.nombre_producto}</Text>
            <Text style={styles.info}>
              {item.unidad} · {item.cantidad}
            </Text>
            <Text style={styles.itemPrice}>
              ${Number(item.subtotal || 0).toFixed(2)}
            </Text>

            <TouchableOpacity
              style={styles.deliverButton}
              onPress={() => entregarProducto(item.id)}
            >
              <Text style={styles.buttonText}>Marcar entregado</Text>
            </TouchableOpacity>
            <TouchableOpacity
  style={styles.cancelItemButton}
  onPress={() => cancelarProducto(item)}
>
  <Text style={styles.buttonText}>Cancelar producto</Text>
</TouchableOpacity>
          </View>
        ))
      )}

  <Text style={styles.section}>Entregados</Text>

{entregados.length === 0 ? (
  <Text style={styles.empty}>Aún no hay productos entregados.</Text>
) : (
  entregados.map((item) => (
    <View key={item.id} style={styles.deliveredCard}>
      <Text style={styles.itemName}>{item.nombre_producto}</Text>
      <Text style={styles.info}>
        {item.unidad} · {item.cantidad}
      </Text>
      <Text style={styles.itemPrice}>
        ${Number(item.subtotal || 0).toFixed(2)}
      </Text>
      <Text style={styles.status}>Entregado</Text>
    </View>
  ))
)}

<Text style={styles.section}>Cancelados</Text>

{cancelados.length === 0 ? (
  <Text style={styles.empty}>No hay productos cancelados.</Text>
) : (
  cancelados.map((item) => (
    <View key={item.id} style={styles.cancelledCard}>
      <Text style={styles.itemName}>{item.nombre_producto}</Text>
      <Text style={styles.info}>
        {item.unidad} · {item.cantidad}
      </Text>
      <Text style={styles.itemPrice}>
        ${Number(item.subtotal || 0).toFixed(2)}
      </Text>
      <Text style={styles.cancelledStatus}>Cancelado</Text>
    </View>
  ))
)}

{ticket.estado === "abierto" && (
        <>
          <Text style={styles.section}>Agregar productos</Text>

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
                    limpiarFormulario();
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
                    onPress={() => seleccionarProducto(producto)}
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
                          style={[
                            styles.chip,
                            activo && styles.chipActiveDark,
                          ]}
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
              <Text style={styles.previewTitle}>Nuevo producto</Text>

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

            <TouchableOpacity style={styles.addButton} onPress={agregarProducto}>
              <Text style={styles.buttonText}>Agregar al pedido</Text>
            </TouchableOpacity>
          </View>
        </>
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  folio: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },
  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginTop: 8,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  deliveredCard: {
    backgroundColor: "#F1F8EC",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#CDE8C1",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 4,
  },
  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },
  total: {
    color: "#8B0000",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
  },
  itemPrice: {
    color: "#C0392B",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  status: {
    color: "#2E7D32",
    fontWeight: "800",
    marginTop: 8,
  },
  empty: {
    color: "#7A6A59",
    marginBottom: 12,
  },
  deliverButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  addButton: {
    backgroundColor: "#D35400",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 10,
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
    backgroundColor: "#C0392B",
    borderColor: "#C0392B",
  },
  productButtonText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  productButtonTextActive: {
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
  previewBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 16,
    padding: 14,
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
  cancelItemButton: {
  backgroundColor: "#B00020",
  paddingVertical: 12,
  borderRadius: 14,
  marginTop: 10,
},
cancelledCard: {
  backgroundColor: "#FDECEC",
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#F3B8B8",
},
cancelledStatus: {
  color: "#B00020",
  fontWeight: "800",
  marginTop: 8,
},
});