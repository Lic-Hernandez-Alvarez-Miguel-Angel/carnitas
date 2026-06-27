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
  obtenerDetalleCaja,
} from "../controllers/cajaController";

export default function CajaView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;
  const usuarioId = usuario?.id || route?.params?.usuarioId || null;
  const puntoVentaId = route?.params?.punto_venta_id || null;

  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [resumenCaja, setResumenCaja] = useState(null);

  const [montoInicial, setMontoInicial] = useState("");
  const [montoFinal, setMontoFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todas");

  const [detalleAbiertoId, setDetalleAbiertoId] = useState(null);
  const [detallesCaja, setDetallesCaja] = useState({});
  const [detalleLoadingId, setDetalleLoadingId] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarCaja();
  }, []);

  const obtenerFechaYYYYMMDD = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const obtenerHoy = () => {
    return obtenerFechaYYYYMMDD(new Date());
  };

  const obtenerAyer = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 1);

    return obtenerFechaYYYYMMDD(fecha);
  };

  const obtenerInicioSemana = () => {
    const fecha = new Date();
    const dia = fecha.getDay();
    const diferencia = dia === 0 ? 6 : dia - 1;

    fecha.setDate(fecha.getDate() - diferencia);

    return obtenerFechaYYYYMMDD(fecha);
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

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "-";

    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  const formatearDinero = (valor) => {
    return Number(valor || 0).toFixed(2);
  };

  const armarFiltros = (inicio = fechaInicio, fin = fechaFin) => {
    const filtros = {};

    if (inicio) {
      filtros.fecha_inicio = inicio;
    }

    if (fin) {
      filtros.fecha_fin = fin;
    }

    if (puntoVentaId) {
      filtros.punto_venta_id = puntoVentaId;
    }

    return filtros;
  };

  const cargarCaja = async (filtrosPersonalizados = null) => {
    try {
      setLoading(true);

      const filtros = filtrosPersonalizados || armarFiltros();

      const abierta = await obtenerCajaAbierta(puntoVentaId);
      const lista = await obtenerHistorialCaja(filtros);

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
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltroRapido = async (tipo) => {
    let inicio = "";
    let fin = "";

    if (tipo === "hoy") {
      inicio = obtenerHoy();
      fin = obtenerHoy();
    }

    if (tipo === "ayer") {
      inicio = obtenerAyer();
      fin = obtenerAyer();
    }

    if (tipo === "semana") {
      inicio = obtenerInicioSemana();
      fin = obtenerHoy();
    }

    if (tipo === "todas") {
      inicio = "";
      fin = "";
    }

    setFiltroActivo(tipo);
    setFechaInicio(inicio);
    setFechaFin(fin);
    setDetalleAbiertoId(null);

    await cargarCaja(armarFiltros(inicio, fin));
  };

  const aplicarFiltroManual = async () => {
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      Alert.alert(
        "Atención",
        "Para buscar por fecha manual, ingresa fecha inicio y fecha fin."
      );
      return;
    }

    setFiltroActivo("manual");
    setDetalleAbiertoId(null);

    await cargarCaja(armarFiltros(fechaInicio, fechaFin));
  };

  const limpiarFiltros = async () => {
    setFechaInicio("");
    setFechaFin("");
    setFiltroActivo("todas");
    setDetalleAbiertoId(null);

    await cargarCaja({});
  };

  const handleAbrirCaja = async () => {
    const monto = Number(montoInicial);

    if (montoInicial.trim() === "" || Number.isNaN(monto) || monto < 0) {
      Alert.alert("Atención", "Ingresa un monto inicial válido.");
      return;
    }

    setLoading(true);

    const result = await abrirCaja({
      usuario_id: usuarioId,
      punto_venta_id: puntoVentaId,
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
            setDetalleAbiertoId(null);
            cargarCaja();
          },
        },
      ]
    );
  };

  const toggleDetalleCaja = async (cajaId) => {
    if (detalleAbiertoId === cajaId) {
      setDetalleAbiertoId(null);
      return;
    }

    setDetalleAbiertoId(cajaId);

    if (detallesCaja[cajaId]) {
      return;
    }

    try {
      setDetalleLoadingId(cajaId);

      const result = await obtenerDetalleCaja(cajaId);

      if (result?.error) {
        Alert.alert("Error", result.error);
        return;
      }

      setDetallesCaja((prev) => ({
        ...prev,
        [cajaId]: result,
      }));
    } catch (error) {
      console.log("Error toggleDetalleCaja:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la caja.");
    } finally {
      setDetalleLoadingId(null);
    }
  };

  const renderFiltroButton = (tipo, texto) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        filtroActivo === tipo && styles.filterChipActive,
      ]}
      onPress={() => aplicarFiltroRapido(tipo)}
      disabled={loading}
    >
      <Text
        style={[
          styles.filterChipText,
          filtroActivo === tipo && styles.filterChipTextActive,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );

  const renderResumenCaja = (resumen) => {
    if (!resumen) return null;

    return (
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Resumen de caja</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Caja inicial</Text>
          <Text style={styles.summaryValue}>
            ${formatearDinero(resumen.monto_inicial)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas en efectivo</Text>
          <Text style={styles.summaryValuePositive}>
            + ${formatearDinero(resumen.ventas_efectivo)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Gastos personales</Text>
          <Text style={styles.summaryValueNegative}>
            - ${formatearDinero(resumen.total_gastos)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelStrong}>Efectivo esperado</Text>
          <Text style={styles.summaryValueStrong}>
            ${formatearDinero(resumen.efectivo_esperado)}
          </Text>
        </View>

        {resumen.monto_final !== null && resumen.monto_final !== undefined ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo contado</Text>
              <Text style={styles.summaryValue}>
                ${formatearDinero(resumen.monto_final)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Diferencia</Text>
              <Text
                style={[
                  styles.summaryValue,
                  Number(resumen.diferencia || 0) >= 0
                    ? styles.summaryValuePositive
                    : styles.summaryValueNegative,
                ]}
              >
                ${formatearDinero(resumen.diferencia)}
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ventas por transferencia</Text>
          <Text style={styles.summaryValueTransfer}>
            ${formatearDinero(resumen.ventas_transferencia)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ingresos totales</Text>
          <Text style={styles.summaryValue}>
            ${formatearDinero(resumen.ventas_totales)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tickets pagados</Text>
          <Text style={styles.summaryValue}>{resumen.total_tickets || 0}</Text>
        </View>

        <Text style={styles.noteText}>
          Las transferencias son ingresos del negocio, pero no se suman al
          efectivo físico de caja.
        </Text>
      </View>
    );
  };

  const renderTransferencias = (transferencias = []) => {
    if (!Array.isArray(transferencias) || transferencias.length === 0) {
      return null;
    }

    return (
      <View style={styles.transferBox}>
        <Text style={styles.summaryTitle}>Transferencias registradas</Text>

        {transferencias.map((transferencia) => (
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
              Comprobante: {transferencia.tiene_comprobante ? "Sí" : "No"}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDetalleCaja = (cajaId) => {
    if (detalleLoadingId === cajaId) {
      return (
        <View style={styles.detailBox}>
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      );
    }

    const detalle = detallesCaja[cajaId];

    if (!detalle) {
      return null;
    }

    const tickets = Array.isArray(detalle.tickets) ? detalle.tickets : [];
    const productosVendidos = Array.isArray(detalle.productos_vendidos)
      ? detalle.productos_vendidos
      : [];
    const gastos = Array.isArray(detalle.gastos) ? detalle.gastos : [];

    return (
      <View style={styles.detailBox}>
        <Text style={styles.detailTitle}>Detalle de caja</Text>

        {renderResumenCaja(detalle.resumen)}
        {renderTransferencias(detalle.resumen?.transferencias || [])}

        <Text style={styles.detailSectionTitle}>Productos vendidos</Text>

        {productosVendidos.length === 0 ? (
          <Text style={styles.emptySmall}>No hay productos vendidos.</Text>
        ) : (
          productosVendidos.map((producto, index) => (
            <View key={`${producto.nombre_producto}-${index}`} style={styles.detailItem}>
              <Text style={styles.detailItemTitle}>
                {producto.nombre_producto || "Producto"}
              </Text>

              <Text style={styles.info}>
                Cantidad: {formatearDinero(producto.cantidad_total)}{" "}
                {producto.unidad}
              </Text>

              <Text style={styles.info}>
                Veces vendido: {producto.veces_vendido || 0}
              </Text>

              <Text style={styles.infoStrong}>
                Total: ${formatearDinero(producto.total_vendido)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.detailSectionTitle}>Tickets de la caja</Text>

        {tickets.length === 0 ? (
          <Text style={styles.emptySmall}>No hay tickets en esta caja.</Text>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketBox}>
              <Text style={styles.ticketTitle}>
                {ticket.folio || `Ticket #${ticket.id}`}
              </Text>

              <Text style={styles.info}>Estado: {ticket.estado}</Text>
              <Text style={styles.info}>
                Pago: {ticket.metodo_pago || "Sin método"}
              </Text>
              <Text style={styles.info}>
                Fecha pago: {formatearFecha(ticket.fecha_pago)}
              </Text>
              <Text style={styles.infoStrong}>
                Total: ${formatearDinero(ticket.total)}
              </Text>

              {Array.isArray(ticket.items) && ticket.items.length > 0 ? (
                <View style={styles.itemsBox}>
                  {ticket.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>
                          {item.nombre_producto}
                        </Text>
                        <Text style={styles.itemSub}>
                          {item.cantidad} {item.unidad} · {item.estado_item}
                        </Text>
                      </View>

                      <Text style={styles.itemPrice}>
                        ${formatearDinero(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.detailSectionTitle}>Gastos de caja</Text>

        {gastos.length === 0 ? (
          <Text style={styles.emptySmall}>No hay gastos registrados.</Text>
        ) : (
          gastos.map((gasto) => (
            <View key={gasto.id} style={styles.gastoItem}>
              <Text style={styles.detailItemTitle}>{gasto.concepto}</Text>
              <Text style={styles.info}>Categoría: {gasto.categoria}</Text>
              <Text style={styles.info}>
                Fecha: {formatearFecha(gasto.fecha_gasto)}
              </Text>

              {gasto.observaciones ? (
                <Text style={styles.info}>Obs: {gasto.observaciones}</Text>
              ) : null}

              <Text style={styles.summaryValueNegative}>
                - ${formatearDinero(gasto.monto)}
              </Text>
            </View>
          ))
        )}
      </View>
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

          {cajaAbierta.punto_venta ? (
            <Text style={styles.info}>
              Punto de venta: {cajaAbierta.punto_venta}
            </Text>
          ) : null}

          <Text style={styles.info}>
            Fecha apertura: {formatearFecha(cajaAbierta.fecha_apertura)}
          </Text>

          {renderResumenCaja(resumenCaja)}
          {renderTransferencias(resumenCaja?.transferencias || [])}

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
            onPress={() => cargarCaja()}
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

      <View style={styles.filterCard}>
        <Text style={styles.cardTitle}>Filtros por día</Text>

        <View style={styles.filterRow}>
          {renderFiltroButton("hoy", "Hoy")}
          {renderFiltroButton("ayer", "Ayer")}
          {renderFiltroButton("semana", "Semana")}
          {renderFiltroButton("todas", "Todas")}
        </View>

        <Text style={styles.label}>Buscar por fecha</Text>

        <View style={styles.dateRow}>
          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Inicio YYYY-MM-DD"
            value={fechaInicio}
            onChangeText={setFechaInicio}
          />

          <TextInput
            style={[styles.input, styles.dateInput]}
            placeholder="Fin YYYY-MM-DD"
            value={fechaFin}
            onChangeText={setFechaFin}
          />
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={aplicarFiltroManual}
          disabled={loading}
        >
          <Text style={styles.applyButtonText}>Aplicar filtro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={limpiarFiltros}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>Limpiar filtros</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Historial de caja</Text>

      {loading ? (
        <Text style={styles.empty}>Cargando...</Text>
      ) : historial.length === 0 ? (
        <Text style={styles.empty}>No hay movimientos de caja.</Text>
      ) : (
        historial.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => toggleDetalleCaja(item.id)}
            >
              <View style={styles.historyHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>
                    Caja #{item.id} - {item.estado}
                  </Text>

                  <Text style={styles.historyDate}>
                    {formatearFechaCorta(item.fecha_apertura)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.statusBadge,
                    item.estado === "abierta"
                      ? styles.statusOpen
                      : styles.statusClosed,
                  ]}
                >
                  {item.estado}
                </Text>
              </View>

              <View style={styles.summaryMiniBox}>
                <View style={styles.miniCol}>
                  <Text style={styles.miniLabel}>Inicial</Text>
                  <Text style={styles.miniValue}>
                    ${formatearDinero(item.monto_inicial)}
                  </Text>
                </View>

                <View style={styles.miniCol}>
                  <Text style={styles.miniLabel}>Efectivo</Text>
                  <Text style={styles.miniValuePositive}>
                    ${formatearDinero(item.ventas_efectivo)}
                  </Text>
                </View>

                <View style={styles.miniCol}>
                  <Text style={styles.miniLabel}>Transfer.</Text>
                  <Text style={styles.miniValueTransfer}>
                    ${formatearDinero(item.ventas_transferencia)}
                  </Text>
                </View>
              </View>

              <Text style={styles.info}>
                Responsable: {item.usuario || "Sin responsable"}
              </Text>

              {item.punto_venta ? (
                <Text style={styles.info}>Punto de venta: {item.punto_venta}</Text>
              ) : null}

              <Text style={styles.info}>
                Apertura: {formatearFecha(item.fecha_apertura)}
              </Text>

              {item.fecha_cierre ? (
                <Text style={styles.info}>
                  Cierre: {formatearFecha(item.fecha_cierre)}
                </Text>
              ) : null}

              <Text style={styles.infoStrong}>
                Efectivo esperado: ${formatearDinero(item.efectivo_esperado)}
              </Text>

              {item.monto_final !== null && item.monto_final !== undefined ? (
                <Text style={styles.info}>
                  Efectivo contado: ${formatearDinero(item.monto_final)}
                </Text>
              ) : null}

              {item.diferencia !== null && item.diferencia !== undefined ? (
                <Text
                  style={[
                    styles.infoStrong,
                    Number(item.diferencia || 0) >= 0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  Diferencia: ${formatearDinero(item.diferencia)}
                </Text>
              ) : null}

              {item.observaciones ? (
                <Text style={styles.observaciones}>
                  Observaciones: {item.observaciones}
                </Text>
              ) : null}

              <Text style={styles.viewDetailText}>
                {detalleAbiertoId === item.id
                  ? "Ocultar detalle ▲"
                  : "Ver detalle ▼"}
              </Text>
            </TouchableOpacity>

            {detalleAbiertoId === item.id ? renderDetalleCaja(item.id) : null}
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

  filterCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
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

  dateRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateInput: {
    flex: 1,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },

  filterChip: {
    backgroundColor: "#F5E5C8",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },

  filterChipActive: {
    backgroundColor: "#8B0000",
  },

  filterChipText: {
    color: "#4A1F0F",
    fontWeight: "800",
  },

  filterChipTextActive: {
    color: "#fff",
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

  applyButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 2,
  },

  applyButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
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
    marginBottom: 12,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },

  historyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 2,
  },

  historyDate: {
    color: "#7A6A59",
    fontWeight: "700",
  },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: "#fff",
    fontWeight: "900",
    overflow: "hidden",
  },

  statusOpen: {
    backgroundColor: "#27AE60",
  },

  statusClosed: {
    backgroundColor: "#8B0000",
  },

  summaryMiniBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },

  miniCol: {
    flex: 1,
  },

  miniLabel: {
    color: "#7A6A59",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },

  miniValue: {
    color: "#4A1F0F",
    fontWeight: "900",
  },

  miniValuePositive: {
    color: "#1E7D32",
    fontWeight: "900",
  },

  miniValueTransfer: {
    color: "#2D5BE3",
    fontWeight: "900",
  },

  detailBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    padding: 12,
    marginTop: 12,
  },

  detailTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4A1F0F",
    marginBottom: 10,
  },

  detailSectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#8B0000",
    marginTop: 12,
    marginBottom: 8,
  },

  detailItem: {
    backgroundColor: "#FFF9F0",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginBottom: 8,
  },

  detailItemTitle: {
    color: "#4A1F0F",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 5,
  },

  ticketBox: {
    backgroundColor: "#F8EFD8",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E9D9BF",
    marginBottom: 10,
  },

  ticketTitle: {
    color: "#8B0000",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 5,
  },

  itemsBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1E2C5",
    paddingVertical: 6,
    gap: 8,
  },

  itemName: {
    color: "#4A1F0F",
    fontWeight: "800",
  },

  itemSub: {
    color: "#7A6A59",
    fontSize: 12,
  },

  itemPrice: {
    color: "#1E7D32",
    fontWeight: "900",
  },

  gastoItem: {
    backgroundColor: "#FDEDEC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F5B7B1",
    marginBottom: 8,
  },

  viewDetailText: {
    color: "#2D5BE3",
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },

  loadingText: {
    color: "#7A6A59",
    textAlign: "center",
    fontWeight: "800",
  },

  info: {
    color: "#6E5B4B",
    marginBottom: 4,
  },

  infoStrong: {
    color: "#1E7D32",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  positiveText: {
    color: "#1E7D32",
  },

  negativeText: {
    color: "#C0392B",
  },

  observaciones: {
    color: "#4A1F0F",
    marginTop: 6,
    fontStyle: "italic",
  },

  empty: {
    color: "#7A6A59",
  },

  emptySmall: {
    color: "#7A6A59",
    fontSize: 13,
    marginBottom: 8,
    fontStyle: "italic",
  },
});
