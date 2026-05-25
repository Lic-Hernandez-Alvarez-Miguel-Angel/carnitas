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

export default function JefeView({ navigation }) {
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
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.badge}>👑 Jefe</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={cerrarSesion}
        >
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Panel del Jefe</Text>
        <Text style={styles.subtitle}>
          Administra tu negocio, consulta reportes, inventario, compras y
          supervisa al personal.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Carnitas El Tío</Text>
        <Text style={styles.summaryText}>
          Bienvenido al centro de control del negocio.
        </Text>
      </View>

      <Menu navigation={navigation} rol="jefe" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#F8EFD8",
    flexGrow: 1,
  },
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
    overflow: "hidden",
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
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#C0392B",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#C0392B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  summaryTitle: {
    color: "#FFF5E1",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  summaryText: {
    color: "#FFE7D6",
    fontSize: 15,
    lineHeight: 22,
  },
});