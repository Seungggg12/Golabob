import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const defaultApiBaseUrl = "http://localhost:3000";

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password1234");
  const [accessToken, setAccessToken] = useState("");
  const [currentUser, setCurrentUser] = useState("-");
  const [log, setLog] = useState("대기 중");

  const appendLog = (title: string, payload: unknown) => {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    setLog(`[${new Date().toLocaleTimeString()}] ${title}\n${body}\n\n${log}`);
  };

  const requestJson = async <T,>(path: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || "요청에 실패했습니다.");
    }

    return body as T;
  };

  const checkHealth = async () => {
    try {
      const body = await requestJson<{ status: string; message: string }>("/api/health");
      appendLog("GET /api/health", body);
    } catch (error) {
      Alert.alert("Health 실패", String(error));
    }
  };

  const signup = async () => {
    try {
      const body = await requestJson<{ user: { email: string; role: string }; accessToken: string }>(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({ email, password, role: "user" }),
        },
      );
      setAccessToken(body.accessToken);
      setCurrentUser(`${body.user.email} / ${body.user.role}`);
      appendLog("POST /api/auth/signup", body);
    } catch (error) {
      Alert.alert("회원가입 실패", String(error));
    }
  };

  const login = async () => {
    try {
      const body = await requestJson<{ user: { email: string; role: string }; accessToken: string }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setAccessToken(body.accessToken);
      setCurrentUser(`${body.user.email} / ${body.user.role}`);
      appendLog("POST /api/auth/login", body);
    } catch (error) {
      Alert.alert("로그인 실패", String(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Golabob Mobile</Text>
        <Text style={styles.title}>인증 API 콘솔</Text>

        <View style={styles.panel}>
          <Text style={styles.label}>API Base URL</Text>
          <TextInput style={styles.input} value={apiBaseUrl} onChangeText={setApiBaseUrl} />
          <TouchableOpacity style={styles.button} onPress={checkHealth}>
            <Text style={styles.buttonText}>서버 상태 확인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>이메일</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Text style={styles.label}>비밀번호</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={signup}>
              <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={login}>
              <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>현재 로그인</Text>
          <Text style={styles.value}>{currentUser}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.label}>요청 결과</Text>
          <Text style={styles.log}>{log}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f7f6",
  },
  container: {
    padding: 20,
    gap: 14,
  },
  eyebrow: {
    color: "#d88c36",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#1d2624",
    fontSize: 30,
    fontWeight: "800",
  },
  panel: {
    gap: 10,
    borderColor: "#d7dfdc",
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  label: {
    color: "#62706c",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 44,
    borderColor: "#d7dfdc",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#246b5a",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
  },
  value: {
    color: "#1d2624",
    fontSize: 16,
    fontWeight: "800",
  },
  log: {
    color: "#1d2624",
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
  },
});
