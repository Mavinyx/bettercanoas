package br.gov.rs.canoas.bettercanoas.domain.user;

public record RegisterRequestDTO(String login, String password, String nome) {
}