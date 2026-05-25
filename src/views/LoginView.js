import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator,
} from "react-native";
import { login } from "../controllers/authController";
import ScreenWrapper from "../components/ScreenWrapper";

export default function LoginView({ navigation }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!correo.trim() || !password.trim()) {
      Alert.alert("Atención", "Ingresa correo y contraseña.");
      return;
    }

    try {
      setCargando(true);

      const user = await login(correo.trim(), password.trim());

      if (!user) {
        Alert.alert("Error ❌", "Correo o contraseña incorrectos");
        return;
      }

      Alert.alert("Bienvenido 👋", "Inicio de sesión correcto");

      if (user.rol === "jefe") {
      navigation.replace("Jefe", {
  usuario: user,
});
      } else {
       navigation.replace("Empleado", {
  usuario: user,
});
      }
    } catch (error) {
      console.log("Error en login:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScreenWrapper
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../assets/imagenes/logoLogin.png")}
                  style={styles.logo}
                />
              </View>

              <Text style={styles.title}>Carnitas El Tío</Text>
              <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

              <TextInput
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                editable={!cargando}
              />

              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#999"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!cargando}
              />

              <TouchableOpacity
                style={[styles.button, cargando && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footer}>
                Bienvenido a las mejores carnitas 🐷🔥
              </Text>
            </View>
          </View>
        </ScreenWrapper>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8EFD8",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#FFF9F0",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logo: {
    width: 170,
    height: 170,
    resizeMode: "contain",
    borderRadius: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: "#8B0000",
    marginBottom: 6,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 25,
    color: "#6B6B6B",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5D7BF",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#C0392B",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: "#C0392B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
    fontSize: 15,
  },
});