import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

export default function RegisterPage(){
    const { register } = useAuth();
    const navigate = useNavigate();

    const [nome, setNome] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [conflictError, setConflictError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setValidationError(null);
        setConflictError(null);
        setSuccessMessage(null);

        if (!nome.trim() || !login.trim() || !password || !confirmPassword) {
        setValidationError("Preencha todos os campos obrigatórios.");
        return;
        }

        if (password !== confirmPassword) {
        setValidationError("A confirmação de senha não confere.");
        return;
        }

        setIsSubmitting(true);
        try {
        await register({
            nome: nome.trim(),
            login: login.trim(),
            password,
        });

        setPassword("");
        setConfirmPassword("");
        setSuccessMessage("Cadastro realizado com sucesso!");

        setTimeout(() => {
            navigate("/login", { replace: true });
        }, 1200);
        } catch (err) {
        setPassword("");
        setConfirmPassword("");

        if (err instanceof ApiError && err.status === 409) {
            setConflictError("Este login já está cadastrado.");
        } else if (err instanceof ApiError && err.status === 400) {
            setValidationError(err.message || "Dados inválidos para cadastro.");
        } else {
            setValidationError(
            err instanceof Error ? err.message : "Erro ao realizar cadastro."
            );
        }
        } finally {
        setIsSubmitting(false);
        }
    }
    return(
        <div className="max-w-md mx-auto my-10 p-6 card bg-base-100 shadow-lg border border-custom-quaternary">
        <h1 className="text-2xl font-bold mb-4 text-custom-primary">Cadastro</h1>

        {validationError && (
            <div role="alert" className="alert alert-warning mb-4 text-sm">
            <span>{validationError}</span>
            </div>
        )}

        {conflictError && (
            <div role="alert" className="alert alert-error mb-4 text-sm">
            <span>{conflictError}</span>
            </div>
        )}

        {successMessage && (
            <div role="status" className="alert alert-success mb-4 text-sm">
            <span>{successMessage}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="label">
                    <span className="label-text font-medium">Nome</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={isSubmitting}
                />
            </div>

            <div>
                <label className="label">
                    <span className="label-text font-medium">Login</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
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

            <div>
                <label className="label">
                    <span className="label-text font-medium">Confirmar senha</span>
                </label>
                <input
                    type="password"
                    className="input input-bordered w-full"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                />
            </div>

            <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={isSubmitting}
            >
            {isSubmitting ? "Enviando cadastro..." : "Cadastrar"}
            </button>
        </form>

        <p className="text-sm mt-4 text-center">
            Já tem conta?{" "}
            <Link to="/login" className="link link-primary font-semibold">
            Fazer login
            </Link>
        </p>
        </div>
    )
}