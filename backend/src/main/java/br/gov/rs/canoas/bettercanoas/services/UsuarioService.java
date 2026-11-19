package br.gov.rs.canoas.bettercanoas.services;

import br.gov.rs.canoas.bettercanoas.domain.user.User;
import br.gov.rs.canoas.bettercanoas.domain.user.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {
    private final UserRepository userRepository;

    public UsuarioService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> getUsuario(long userId){
        return userRepository.findById(userId);
    }
}
