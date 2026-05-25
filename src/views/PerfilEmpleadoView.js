import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";

export default function PerfilEmpleadoView({ navigation, route }) {
  const usuario = route?.params?.usuario || {};

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>👤 Mi perfil</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{usuario.nombre || "Sin nombre"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Correo</Text>
        <Text style={styles.value}>{usuario.correo || "Sin correo"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{usuario.rol || "empleado"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>ID empleado</Text>
        <Text style={styles.value}>{usuario.id || "-"}</Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#4A1F0F",
  },
  backButton: {
    backgroundColor: "#C0392B",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9D9BF",
  },
  label: {
    color: "#7A6A59",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  value: {
    color: "#8B0000",
    fontSize: 22,
    fontWeight: "800",
  },
});