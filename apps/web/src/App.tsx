import { FormEvent, useEffect, useState } from "react";

interface PublicUser {
  id: string;
  email: string;
  role: string;
}

interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

const defaultApiBaseUrl = "http://localhost:3000";

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("golabobAccessToken") || "",
  );
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [health, setHealth] = useState("확인 전");
  const [log, setLog] = useState("대기 중");
  const [signupEmail, setSignupEmail] = useState("guest@example.com");
  const [signupPassword, setSignupPassword] = useState("password1234");
  const [signupRole, setSignupRole] = useState("guest");
  const [loginEmail, setLoginEmail] = useState("guest@example.com");
  const [loginPassword, setLoginPassword] = useState("password1234");

  const appendLog = (title: string, payload: unknown) => {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    const next = `[${new Date().toLocaleTimeString("ko-KR", { hour12: false })}] ${title}\n${body}`;
    setLog((prev) => (prev === "대기 중" ? next : `${next}\n\n${prev}`));
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
      setHealth(`${body.status}: ${body.message}`);
      appendLog("GET /api/health", body);
    } catch (error) {
      setHealth(error instanceof Error ? error.message : "요청 실패");
      appendLog("GET /api/health 실패", String(error));
    }
  };

  const signup = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const body = await requestJson<AuthResponse>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
        }),
      });
      localStorage.setItem("golabobAccessToken", body.accessToken);
      setAccessToken(body.accessToken);
      setCurrentUser(body.user);
      appendLog("POST /api/auth/signup", body);
    } catch (error) {
      appendLog("POST /api/auth/signup 실패", String(error));
    }
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();

    try {
      const body = await requestJson<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      localStorage.setItem("golabobAccessToken", body.accessToken);
      setAccessToken(body.accessToken);
      setCurrentUser(body.user);
      appendLog("POST /api/auth/login", body);
    } catch (error) {
      appendLog("POST /api/auth/login 실패", String(error));
    }
  };

  const fetchMe = async () => {
    if (!accessToken) {
      appendLog("GET /api/auth/me 실패", "로그인 토큰이 없습니다.");
      return;
    }

    try {
      const body = await requestJson<{ user: PublicUser }>("/api/auth/me");
      setCurrentUser(body.user);
      appendLog("GET /api/auth/me", body);
    } catch (error) {
      appendLog("GET /api/auth/me 실패", String(error));
    }
  };

  const logout = () => {
    localStorage.removeItem("golabobAccessToken");
    setAccessToken("");
    setCurrentUser(null);
    appendLog("로그아웃", "로컬 토큰을 삭제했습니다.");
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Golabob Web</p>
          <h1>인증 API 콘솔</h1>
        </div>
        <label>
          API Base URL
          <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
        </label>
      </section>

      <section className="status-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>서버 상태</h2>
              <p>{health}</p>
            </div>
            <button type="button" onClick={checkHealth}>확인</button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>현재 로그인</h2>
              <p>{currentUser ? `${currentUser.email} / ${currentUser.role}` : "로그인 전"}</p>
            </div>
            <button className="secondary" type="button" onClick={logout}>로그아웃</button>
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="panel">
          <h2>회원가입</h2>
          <form className="form-stack" onSubmit={signup}>
            <input value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} />
            <input value={signupPassword} type="password" onChange={(event) => setSignupPassword(event.target.value)} />
            <select value={signupRole} onChange={(event) => setSignupRole(event.target.value)}>
              <option value="guest">guest</option>
              <option value="owner">owner</option>
            </select>
            <button type="submit">회원가입</button>
          </form>
        </article>

        <article className="panel">
          <h2>로그인</h2>
          <form className="form-stack" onSubmit={login}>
            <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            <input value={loginPassword} type="password" onChange={(event) => setLoginPassword(event.target.value)} />
            <button type="submit">로그인</button>
          </form>
          <button className="secondary full-width" type="button" onClick={fetchMe}>내 정보 다시 조회</button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>요청 결과</h2>
              <p>최근 API 응답과 오류를 표시합니다.</p>
            </div>
            <button className="secondary" type="button" onClick={() => setLog("대기 중")}>비우기</button>
          </div>
          <pre className="activity-log">{log}</pre>
        </article>
      </section>
    </main>
  );
}

export default App;
