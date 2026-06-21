import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginView from "../views/LoginView";
import JefeView from "../views/JefeView";
import EmpleadoView from "../views/EmpleadoView";
import VentasView from "../views/VentasView";
import TicketsView from "../views/TicketsView";
import InventarioView from "../views/InventarioView";
import ReportesView from "../views/ReportesView";
import GestionEmpleadosView from "../views/GestionEmpleadosView";
import ComprasView from "../views/ComprasView";
import DetallePedidoView from "../views/DetallePedidoView";
import ConsumiblesView from "../views/ConsumiblesView";
import PerfilEmpleadoView from "../views/PerfilEmpleadoView";
import CajaView from "../views/CajaView";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* LOGIN */}
        <Stack.Screen
          name="Login"
          component={LoginView}
        />

        {/* PANELES PRINCIPALES */}
        <Stack.Screen
          name="Jefe"
          component={JefeView}
        />

        <Stack.Screen
          name="Empleado"
          component={EmpleadoView}
        />

        {/* CAJA DEL JEFE */}
        <Stack.Screen
          name="Caja"
          component={CajaView}
        />

        {/* PERFIL EMPLEADO */}
        <Stack.Screen
          name="PerfilEmpleado"
          component={PerfilEmpleadoView}
        />

        {/* VENTAS */}
        <Stack.Screen
          name="Ventas"
          component={VentasView}
        />

        <Stack.Screen
          name="Tickets"
          component={TicketsView}
        />

        <Stack.Screen
          name="DetallePedido"
          component={DetallePedidoView}
        />

        {/* INVENTARIO / CONSUMIBLES */}
        <Stack.Screen
          name="Inventario"
          component={InventarioView}
        />

        <Stack.Screen
          name="Consumibles"
          component={ConsumiblesView}
        />

        {/* ADMINISTRACIÓN */}
        <Stack.Screen
          name="Reportes"
          component={ReportesView}
        />

        <Stack.Screen
          name="GestionEmpleados"
          component={GestionEmpleadosView}
        />

        <Stack.Screen
          name="Compras"
          component={ComprasView}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}