import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

interface LocationState {
  from?: { pathname?: string };
}
export default function LoginPage(){
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [loginInput, setLoginInput] = useState("");
    const [password, setPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [credentialsError, setCredentialsError] = useState<string | null>(null);

    const destino =
        (location.state as LocationState | null)?.from?.pathname || "/denuncia";

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setValidationError(null);
        setCredentialsError(null);

        if (!loginInput.trim() || !password) {
            setValidationError("Informe login e senha.");
            return;
        }

        setIsSubmitting(true);
        try {
            await login({ login: loginInput.trim(), password });
            setPassword("");
            navigate(destino, { replace: true });
        } catch (err) {
            setPassword("");
                if (
                    err instanceof ApiError &&
                    (err.status === 401 || err.status === 403 || err.status === 400)
                ) {
                    setCredentialsError("Login ou senha inválidos.");
            } else {
                setCredentialsError(
                    err instanceof Error ? err.message : "Erro ao autenticar."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
  }

  return (
    <div className="max-w-md mx-auto my-10 p-6 card bg-base-100 shadow-lg border border-custom-quaternary">
      <h1 className="text-2xl font-bold mb-4 text-custom-primary">Entrar</h1>

      {validationError && (
        <div role="alert" className="alert alert-warning mb-4 text-sm">
          <span>{validationError}</span>
        </div>
      )}

      {credentialsError && (
        <div role="alert" className="alert alert-error mb-4 text-sm">
          <span>{credentialsError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label">
            <span className="label-text font-medium">Login</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="label">
            <span className="label-text font-medium">Senha</span>
          </label>
          <input
            type="password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          className="btn btn-custom-primary w-full mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm mt-4 text-center">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="link link-primary font-semibold">
          Criar conta
        </Link>
      </p>
    </div>
  );
}