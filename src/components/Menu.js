import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Menu({ rol, navigation, usuario }) {
  const opciones =
    rol === "jefe"
      ? [
          { titulo: "Reportes", icono: "📊", pantalla: "Reportes" },
          { titulo: "Empleados", icono: "👥", pantalla: "GestionEmpleados" },
          { titulo: "Compras", icono: "🛒", pantalla: "Compras" },
          { titulo: "Inventario", icono: "📦", pantalla: "Inventario" },
          { titulo: "Caja", icono: "💵", pantalla: "Caja" },
        ]
      : [
          { titulo: "Ventas", icono: "🍖", pantalla: "Ventas" },
          { titulo: "Consumibles", icono: "🥬", pantalla: "Consumibles" },
        ];

  const irAPantalla = (pantalla) => {
    navigation.navigate(pantalla, {
      usuario,
      usuarioId: usuario?.id,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Menú Principal</Text>

      {opciones.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => irAPantalla(item.pantalla)}
        >
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{item.icono}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardSubtitle}>
              Ir a la sección de {item.titulo.toLowerCase()}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2E1B0E",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0E1C8",
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F7E6C4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A1F0F",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#8A7A6A",
    marginTop: 3,
  },
  arrow: {
    fontSize: 28,
    color: "#C0392B",
    fontWeight: "bold",
    marginLeft: 8,
  },
});