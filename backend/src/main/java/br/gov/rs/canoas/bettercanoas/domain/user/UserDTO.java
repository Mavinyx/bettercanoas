package br.gov.rs.canoas.bettercanoas.domain.user;

import br.gov.rs.canoas.bettercanoas.domain.user.User;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

public record UserDTO(
        String nome,
        String login,
        Integer xp,
        List<String> papel
) {
    @SuppressWarnings("null")
    public static UserDTO fromEntity(User usuario){
        return new UserDTO(
                usuario.getNome(),
                usuario.getLogin(),
                usuario.getXp(),
                usuario.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList()
        );
    }
}
