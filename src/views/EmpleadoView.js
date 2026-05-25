import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import Menu from "../components/Menu";
import ScreenWrapper from "../components/ScreenWrapper";

export default function EmpleadoView({ navigation, route }) {
  const usuario = route?.params?.usuario || null;
  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Deseas regresar al inicio de sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sí",
        onPress: () => navigation.replace("Login"),
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.topBar}>
        <TouchableOpacity
  style={styles.badgeButton}
  onPress={() =>
    navigation.navigate("PerfilEmpleado", {
      usuario,
    })
  }
>
  <Text style={styles.badge}>👷 Empleado</Text>
</TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion}>
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Panel del Empleado</Text>
        <Text style={styles.subtitle}>
          Accede rápido a ventas e inventario para trabajar de forma ágil.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Carnitas El Tío</Text>
        <Text style={styles.summaryText}>
          Bienvenido. Aquí puedes gestionar tus actividades del día.
        </Text>
      </View>

    <Menu navigation={navigation} rol="empleado" usuario={usuario} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FCE3B4",
    color: "#8B0000",
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  logoutButton: {
    backgroundColor: "#8B0000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#4A1F0F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#7A6A59",
  },
  summaryCard: {
    backgroundColor: "#D35400",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    color: "#FFF5E1",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  summaryText: {
    color: "#FFF0D9",
    fontSize: 15,
  },
});