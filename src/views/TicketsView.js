import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import ScreenWrapper from "../components/ScreenWrapper";
import {
  obtenerTickets,
  solicitarFinalizacionTicket,
  confirmarFinalizacionTicket,
} from "../controllers/ticketsController";
import { apiGet } from "../services/api";

export default function TicketsView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;
  const usuarioId = usuario?.id || route?.params?.usuarioId || null;
  const rol = usuario?.rol || route?.params?.rol || "empleado";

  const [tickets, setTickets] = useState([]);
  const [ticketPagandoId, setTicketPagandoId] = useState(null);
  const [montoPagado, setMontoPagado] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [comprobantePago, setComprobantePago] = useState(null);
  const [zonaAsignada, setZonaAsignada] = useState(null);
  const [comprobanteModal, setComprobanteModal] = useState(null);

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

      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error cargando tickets:", error);
      Alert.alert("Error", "No se pudieron cargar los tickets.");
    }
  };

  const limpiarPago = () => {
    setTicketPagandoId(null);
    setMontoPagado("");
    setMetodoPago("efectivo");
    setComprobantePago(null);
  };

  const abrirPanelPago = (ticketId) => {
    setTicketPagandoId(ticketId);
    setMontoPagado("");
    setMetodoPago("efectivo");
    setComprobantePago(null);
  };

  const seleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    setMontoPagado("");
    setComprobantePago(null);
  };

  const tomarFotoComprobante = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir el uso de la cámara para tomar el comprobante."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
     mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.45,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const foto = result.assets[0];

        if (!foto.base64) {
          Alert.alert("Error", "No se pudo obtener la imagen del comprobante.");
          return;
        }

        setComprobantePago({
          base64: foto.base64,
          mime: foto.mimeType || "image/jpeg",
          uri: foto.uri,
        });

        Alert.alert("Comprobante", "Foto del comprobante guardada.");
      }
    } catch (error) {
      console.log("Error tomarFotoComprobante:", error);
      Alert.alert("Error", "No se pudo tomar la foto del comprobante.");
    }
  };

  const seleccionarComprobanteGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir el acceso a la galería para seleccionar el comprobante."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.45,
        base64: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const foto = result.assets[0];

        if (!foto.base64) {
          Alert.alert("Error", "No se pudo obtener la imagen del comprobante.");
          return;
        }

        setComprobantePago({
          base64: foto.base64,
          mime: foto.mimeType || "image/jpeg",
          uri: foto.uri,
        });

        Alert.alert("Comprobante", "Comprobante seleccionado correctamente.");
      }
    } catch (error) {
      console.log("Error seleccionarComprobanteGaleria:", error);
      Alert.alert("Error", "No se pudo seleccionar el comprobante.");
    }
  };

  const abrirComprobante = (ticket) => {
    if (!ticket?.comprobante_pago) {
      Alert.alert("Sin comprobante", "Este ticket no tiene comprobante guardado.");
      return;
    }

    setComprobanteModal({
      mime: ticket.comprobante_pago_mime || "image/jpeg",
      base64: ticket.comprobante_pago,
      folio: ticket.folio,
    });
  };

  const handleFinalizarTicket = async (ticket) => {
    const total = Number(ticket.total || 0);
    const pagado = parseFloat(montoPagado);

    if (metodoPago === "efectivo") {
      if (isNaN(pagado) || pagado < total) {
        Alert.alert(
          "Pago insuficiente",
          `El cliente debe pagar mínimo $${total.toFixed(2)}`
        );
        return;
      }
    }

    if (metodoPago === "transferencia" && !comprobantePago?.base64) {
      Alert.alert(
        "Comprobante requerido",
        "Para pago por transferencia debes tomar o seleccionar la foto del comprobante."
      );
      return;
    }

    try {
      const result = await solicitarFinalizacionTicket(ticket.id, {
        metodo_pago: metodoPago,
        monto_pagado: metodoPago === "efectivo" ? pagado : total,
        comprobante_pago:
          metodoPago === "transferencia" ? comprobantePago.base64 : null,
        comprobante_pago_mime:
          metodoPago === "transferencia"
            ? comprobantePago.mime || "image/jpeg"
            : null,
      });

      if (result?.error) {
        Alert.alert("Atención", result.error);
        return;
      }

      const cambio = metodoPago === "efectivo" ? pagado - total : 0;

      Alert.alert(
        "Solicitud enviada",
        metodoPago === "efectivo"
          ? `El ticket fue enviado al jefe para confirmación.\n\nMétodo: Efectivo\nTotal: $${total.toFixed(
              2
            )}\nPagó: $${pagado.toFixed(2)}\nCambio: $${cambio.toFixed(2)}`
          : `El ticket fue enviado al jefe para confirmación.\n\nMétodo: Transferencia\nTotal: $${total.toFixed(
              2
            )}\nComprobante guardado correctamente.`
      );

      limpiarPago();
      cargarTickets();
    } catch (error) {
      console.log("Error solicitando finalización:", error);
      Alert.alert("Error", "No se pudo solicitar la finalización del ticket.");
    }
  };

  const handleConfirmarFinalizacion = async (ticket) => {
    const metodo = ticket.metodo_pago || "-";
    const total = Number(ticket.total || 0);

    Alert.alert(
      "Confirmar finalización",
      `¿Deseas cerrar definitivamente el ticket ${ticket.folio}?\n\nTotal: $${total.toFixed(
        2
      )}\nMétodo de pago: ${metodo}`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            const result = await confirmarFinalizacionTicket(ticket.id, usuario);

            if (result?.error) {
              Alert.alert("Atención", result.error);
              return;
            }

            Alert.alert("Finalizado", "El ticket fue confirmado por el jefe.");
            cargarTickets();
          },
        },
      ]
    );
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
            ticketPagandoId === ticket.id && metodoPago === "efectivo"
              ? Math.max(pagado - total, 0)
              : 0;

          const mostrarPago =
            ticket.estado === "pendiente_confirmacion" ||
            ticket.estado === "cerrado";

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

              {ticket.estado === "pendiente_confirmacion" && (
                <Text style={styles.pendingText}>
                  Pendiente de confirmación por jefe
                </Text>
              )}

              <Text style={styles.info}>
                Fecha: {ticket.fecha_venta || ticket.fecha || "-"}
              </Text>

              {mostrarPago && (
                <View style={styles.paymentInfoBox}>
                  <Text style={styles.paymentInfoTitle}>Información de pago</Text>

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

                  {ticket.fecha_pago ? (
                    <Text style={styles.info}>Fecha pago: {ticket.fecha_pago}</Text>
                  ) : null}

                  {ticket.metodo_pago === "transferencia" && (
                    <TouchableOpacity
                      style={styles.receiptButton}
                      onPress={() => abrirComprobante(ticket)}
                    >
                      <Text style={styles.receiptButtonText}>
                        Ver comprobante
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
                rol !== "jefe" &&
                (ticketPagandoId === ticket.id ? (
                  <View style={styles.paymentBox}>
                    <Text style={styles.paymentTitle}>Selecciona el pago</Text>

                    <View style={styles.methodRow}>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          metodoPago === "efectivo" && styles.methodButtonActive,
                        ]}
                        onPress={() => seleccionarMetodoPago("efectivo")}
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            metodoPago === "efectivo" &&
                              styles.methodButtonTextActive,
                          ]}
                        >
                          Efectivo
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          metodoPago === "transferencia" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() => seleccionarMetodoPago("transferencia")}
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            metodoPago === "transferencia" &&
                              styles.methodButtonTextActive,
                          ]}
                        >
                          Transferencia
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {metodoPago === "efectivo" ? (
                      <>
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
                      </>
                    ) : (
                      <View style={styles.transferBox}>
                        <Text style={styles.transferText}>
                          Para transferencia es obligatorio guardar el
                          comprobante del pago.
                        </Text>

                        {comprobantePago?.uri ? (
                          <Image
                            source={{ uri: comprobantePago.uri }}
                            style={styles.previewImage}
                          />
                        ) : null}

                        <TouchableOpacity
                          style={styles.cameraButton}
                          onPress={tomarFotoComprobante}
                        >
                          <Text style={styles.cameraButtonText}>
                            Tomar foto del comprobante
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.galleryButton}
                          onPress={seleccionarComprobanteGaleria}
                        >
                          <Text style={styles.galleryButtonText}>
                            Seleccionar de galería
                          </Text>
                        </TouchableOpacity>

                        {comprobantePago?.base64 ? (
                          <Text style={styles.receiptReady}>
                            Comprobante cargado correctamente
                          </Text>
                        ) : null}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.finishButton}
                      onPress={() => handleFinalizarTicket(ticket)}
                    >
                      <Text style={styles.finishButtonText}>
                        Solicitar finalización
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={limpiarPago}
                    >
                      <Text style={styles.finishButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => abrirPanelPago(ticket.id)}
                  >
                    <Text style={styles.finishButtonText}>Finalizar orden</Text>
                  </TouchableOpacity>
                ))}

              {ticket.estado === "pendiente_confirmacion" && rol === "jefe" && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => handleConfirmarFinalizacion(ticket)}
                >
                  <Text style={styles.finishButtonText}>
                    Confirmar finalización
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Modal
        visible={!!comprobanteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setComprobanteModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Comprobante {comprobanteModal?.folio || ""}
            </Text>

            {comprobanteModal?.base64 ? (
              <Image
                source={{
                  uri: `data:${comprobanteModal.mime};base64,${comprobanteModal.base64}`,
                }}
                style={styles.comprobanteImage}
                resizeMode="contain"
              />
            ) : null}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setComprobanteModal(null)}
            >
              <Text style={styles.finishButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    fontWeight: "800",
  },

  section: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 12,
  },

  empty: {
    color: "#7A6A59",
    fontSize: 15,
  },

  ticketCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  folio: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 8,
  },

  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },

  pendingText: {
    color: "#B26A00",
    backgroundColor: "#FFF4D7",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontWeight: "800",
    marginVertical: 8,
  },

  total: {
    color: "#2E1B0E",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 12,
  },

  detailButton: {
    backgroundColor: "#F7E6C4",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },

  detailButtonText: {
    color: "#4A1F0F",
    textAlign: "center",
    fontWeight: "800",
  },

  paymentBox: {
    backgroundColor: "#FDF1DF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginTop: 8,
  },

  paymentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 10,
  },

  paymentInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },

  paymentInfoBox: {
    backgroundColor: "#F3F8FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CFE0F5",
    marginTop: 8,
    marginBottom: 8,
  },

  paymentInfoTitle: {
    color: "#1B4B7A",
    fontWeight: "800",
    marginBottom: 6,
  },

  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  methodButton: {
    flex: 1,
    backgroundColor: "#FFF9F0",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
  },

  methodButtonActive: {
    backgroundColor: "#8B0000",
    borderColor: "#8B0000",
  },

  methodButtonText: {
    color: "#4A1F0F",
    textAlign: "center",
    fontWeight: "800",
  },

  methodButtonTextActive: {
    color: "#fff",
  },

  changeText: {
    color: "#1E7D32",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },

  transferBox: {
    backgroundColor: "#FFF9F0",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 12,
  },

  transferText: {
    color: "#6E5B4B",
    marginBottom: 10,
    lineHeight: 20,
  },

  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: "#EEE",
  },

  cameraButton: {
    backgroundColor: "#2E86C1",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
  },

  cameraButtonText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },

  galleryButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
  },

  galleryButtonText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },

  receiptReady: {
    color: "#1E7D32",
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },

  receiptButton: {
    backgroundColor: "#2E86C1",
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },

  receiptButtonText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },

  finishButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },

  confirmButton: {
    backgroundColor: "#1E7D32",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },

  cancelButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },

  finishButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 20,
    padding: 16,
    width: "100%",
    maxHeight: "90%",
  },

  modalTitle: {
    color: "#4A1F0F",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },

  comprobanteImage: {
    width: "100%",
    height: 480,
    backgroundColor: "#EEE",
    borderRadius: 14,
  },

  modalCloseButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
});
