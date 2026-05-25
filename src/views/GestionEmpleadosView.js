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
import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

export default function GestionEmpleadosView({ navigation }) {
  const [empleados, setEmpleados] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");

  const [empleadoAsignando, setEmpleadoAsignando] = useState(null);
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const empleadosData = await apiGet("/asignaciones/empleados");
      const puntosData = await apiGet("/consumibles/puntos-venta");

      setEmpleados(empleadosData);
      setPuntosVenta(puntosData);
    } catch (error) {
      console.log("Error cargando empleados:", error);
      Alert.alert("Error", "No se pudieron cargar los empleados.");
    }
  };

  const empleadosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return empleados;

    return empleados.filter((emp) => {
      const nombre = String(emp.empleado || emp.nombre || "").toLowerCase();
      const correo = String(emp.correo || "").toLowerCase();
      const puntoVenta = String(emp.punto_venta || "").toLowerCase();

      return (
        nombre.includes(texto) ||
        correo.includes(texto) ||
        puntoVenta.includes(texto)
      );
    });
  }, [empleados, busqueda]);

  const eliminarEmpleado = (id) => {
    Alert.alert("Eliminar empleado", "¿Deseas eliminar este empleado?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: async () => {
          try {
            await apiDelete(`/usuarios/${id}`);
            Alert.alert("Correcto", "Empleado eliminado.");
            cargarDatos();
          } catch (error) {
            console.log("Error eliminando empleado:", error);
            Alert.alert("Error", "No se pudo eliminar el empleado.");
          }
        },
      },
    ]);
  };

  const guardarNuevaPassword = async () => {
    if (!nuevaPassword.trim()) {
      Alert.alert("Atención", "Ingresa una contraseña.");
      return;
    }

    try {
      await apiPut(`/usuarios/${empleadoEditando}/password`, {
        password: nuevaPassword,
      });

      Alert.alert("Correcto", "Contraseña actualizada.");
      setEmpleadoEditando(null);
      setNuevaPassword("");
      cargarDatos();
    } catch (error) {
      console.log("Error cambiando contraseña:", error);
      Alert.alert("Error", "No se pudo cambiar la contraseña.");
    }
  };

  const iniciarAsignacion = (empleado) => {
    setEmpleadoAsignando(empleado.usuario_id || empleado.id);
    setPuntoVentaSeleccionado(empleado.punto_venta_id || null);
  };

  const cancelarAsignacion = () => {
    setEmpleadoAsignando(null);
    setPuntoVentaSeleccionado(null);
  };

  const guardarAsignacion = async (empleado) => {
    const usuarioId = empleado.usuario_id || empleado.id;

    if (!puntoVentaSeleccionado) {
      Alert.alert("Atención", "Selecciona un punto de venta.");
      return;
    }

    try {
      const result = await apiPost("/asignaciones", {
        usuario_id: usuarioId,
        punto_venta_id: puntoVentaSeleccionado,
      });

      if (result?.error) {
        Alert.alert("Error", result.error);
        return;
      }

      Alert.alert("Correcto", "Zona asignada correctamente.");
      cancelarAsignacion();
      cargarDatos();
    } catch (error) {
      console.log("Error asignando zona:", error);
      Alert.alert("Error", "No se pudo asignar la zona.");
    }
  };

  const quitarAsignacion = (asignacionId) => {
    if (!asignacionId) {
      Alert.alert("Atención", "Este empleado no tiene zona asignada.");
      return;
    }

    Alert.alert("Quitar zona", "¿Deseas quitar la zona asignada?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Quitar",
        onPress: async () => {
          try {
            await apiPut(`/asignaciones/${asignacionId}/desactivar`, {});
            Alert.alert("Correcto", "Zona quitada correctamente.");
            cargarDatos();
          } catch (error) {
            console.log("Error quitando zona:", error);
            Alert.alert("Error", "No se pudo quitar la zona.");
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>👥 Gestión de Empleados</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Buscar empleado</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, correo o zona"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {empleadosFiltrados.length === 0 ? (
        <Text style={styles.empty}>No hay empleados registrados.</Text>
      ) : (
        empleadosFiltrados.map((empleado) => {
          const empleadoId = empleado.usuario_id || empleado.id;
          const nombre = empleado.empleado || empleado.nombre || "Sin nombre";
          const estaAsignando = empleadoAsignando === empleadoId;

          return (
            <View key={empleadoId} style={styles.card}>
              <Text style={styles.name}>{nombre}</Text>
              <Text style={styles.info}>Correo: {empleado.correo}</Text>
              <Text style={styles.info}>Rol: {empleado.rol}</Text>

              <View style={styles.zoneBox}>
                <Text style={styles.zoneLabel}>Zona asignada</Text>
                <Text style={styles.zoneValue}>
                  {empleado.punto_venta || "Sin zona asignada"}
                </Text>
              </View>

              {estaAsignando ? (
                <View style={styles.assignBox}>
                  <Text style={styles.assignTitle}>Selecciona zona</Text>

                  <View style={styles.rowWrap}>
                    {puntosVenta.map((punto) => (
                      <TouchableOpacity
                        key={punto.id}
                        style={[
                          styles.chip,
                          puntoVentaSeleccionado === punto.id &&
                            styles.chipActive,
                        ]}
                        onPress={() => setPuntoVentaSeleccionado(punto.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            puntoVentaSeleccionado === punto.id &&
                              styles.chipTextActive,
                          ]}
                        >
                          {punto.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => guardarAsignacion(empleado)}
                  >
                    <Text style={styles.buttonText}>Guardar zona</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelarAsignacion}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => iniciarAsignacion(empleado)}
                >
                  <Text style={styles.buttonText}>
                    {empleado.punto_venta ? "Cambiar zona" : "Asignar zona"}
                  </Text>
                </TouchableOpacity>
              )}

              {empleado.punto_venta && !estaAsignando && (
                <TouchableOpacity
                  style={styles.removeZoneButton}
                  onPress={() => quitarAsignacion(empleado.asignacion_id)}
                >
                  <Text style={styles.buttonText}>Quitar zona</Text>
                </TouchableOpacity>
              )}

              {empleadoEditando === empleadoId ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    value={nuevaPassword}
                    onChangeText={setNuevaPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={guardarNuevaPassword}
                  >
                    <Text style={styles.buttonText}>Guardar contraseña</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEmpleadoEditando(null);
                      setNuevaPassword("");
                    }}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEmpleadoEditando(empleadoId)}
                >
                  <Text style={styles.buttonText}>Cambiar contraseña</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => eliminarEmpleado(empleadoId)}
              >
                <Text style={styles.buttonText}>Eliminar empleado</Text>
              </TouchableOpacity>
            </View>
          );
        })
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
    marginBottom: 20,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
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
  searchCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  searchLabel: {
    color: "#4A1F0F",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
  },
  empty: {
    color: "#7A6A59",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#8B0000",
    marginBottom: 6,
  },
  info: {
    color: "#6E5B4B",
    marginBottom: 8,
  },
  zoneBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  zoneLabel: {
    color: "#7A6A59",
    fontWeight: "700",
    marginBottom: 4,
  },
  zoneValue: {
    color: "#4A1F0F",
    fontSize: 16,
    fontWeight: "800",
  },
  assignBox: {
    backgroundColor: "#FDF1E0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  assignTitle: {
    color: "#4A1F0F",
    fontWeight: "800",
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
  chipText: {
    color: "#4A1F0F",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5D3B3",
    marginBottom: 10,
  },
  assignButton: {
    backgroundColor: "#D35400",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  removeZoneButton: {
    backgroundColor: "#7F8C8D",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: "#D35400",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#27AE60",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#7F8C8D",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#8B0000",
    padding: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
});