package br.gov.rs.canoas.bettercanoas.controllers;

import br.gov.rs.canoas.bettercanoas.domain.user.Role;
import br.gov.rs.canoas.bettercanoas.domain.user.UserRepository;
import br.gov.rs.canoas.bettercanoas.domain.user.*;
import br.gov.rs.canoas.bettercanoas.domain.user.User;
import br.gov.rs.canoas.bettercanoas.infra.security.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository repository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @RequestBody @Valid LoginRequestDTO data,
            HttpServletRequest request
    ) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(data.login(), data.password());
        var auth = this.authenticationManager.authenticate(usernamePassword);

        var token = tokenService.generateToken((User) Objects.requireNonNull(auth.getPrincipal()));
        ResponseCookie authCookie = tokenService.createAuthCookie(token, tokenService.isSecureRequest(request));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie.toString())
                .body(new LoginResponseDTO(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        ResponseCookie clearCookie = tokenService.createClearAuthCookie(tokenService.isSecureRequest(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody @Valid RegisterRequestDTO data) {
        if (this.repository.existsByLogin(data.login())) {
            return ResponseEntity.badRequest().body("{\"ok\": \"true\", \"mensagem\": \"login já cadastrado\"}");
        }

        String encryptedPassword = passwordEncoder.encode(data.password());

        User newUser = new User(
                data.login(),
                encryptedPassword,
                data.nome(),
                Role.PLAYER.getId()
        );
        this.repository.save(newUser);

        return ResponseEntity.ok("{\"ok\": \"true\", \"mensagem\": \"usuário criado com sucesso\"}");
    }

    @GetMapping("/me")
    public ResponseEntity<Object> getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;
        User  user = (User) authentication.getPrincipal();

        assert user != null;
        return ResponseEntity.ok(UserDTO.fromEntity(user));
    }
}