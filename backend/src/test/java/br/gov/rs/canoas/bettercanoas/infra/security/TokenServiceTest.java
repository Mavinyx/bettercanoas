package br.gov.rs.canoas.bettercanoas.infra.security;

import br.gov.rs.canoas.bettercanoas.domain.user.Role;
import br.gov.rs.canoas.bettercanoas.domain.user.User;
import br.gov.rs.canoas.bettercanoas.domain.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TokenServiceTest {

    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService();
        ReflectionTestUtils.setField(tokenService, "secret", "test-secret-key-123");
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCreateHttpOnlyAuthCookieAndClearCookie() {
        User user = new User("morador", "hash", "Morador Canoas", Role.PLAYER.getId());
        String jwt = tokenService.generateToken(user);

        ResponseCookie cookie = tokenService.createAuthCookie(jwt, false);
        assertTrue(cookie.isHttpOnly());
        assertFalse(cookie.isSecure());
        assertEquals("Lax", cookie.getSameSite());
        assertEquals("/", cookie.getPath());
        assertEquals(jwt, cookie.getValue());

        ResponseCookie secureCookie = tokenService.createAuthCookie(jwt, true);
        assertTrue(secureCookie.isHttpOnly());
        assertTrue(secureCookie.isSecure());
        assertEquals("None", secureCookie.getSameSite());

        ResponseCookie clearCookie = tokenService.createClearAuthCookie(false);
        assertTrue(clearCookie.isHttpOnly());
        assertEquals(0, clearCookie.getMaxAge().getSeconds());
        assertEquals("", clearCookie.getValue());
    }

    @Test
    void securityFilterShouldAuthenticateFromHttpOnlyCookie() throws Exception {
        User user = new User("morador", "hash", "Morador Canoas", Role.PLAYER.getId());
        String jwt = tokenService.generateToken(user);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByLogin("morador")).thenReturn(user);

        SecurityFilter filter = new SecurityFilter(tokenService, userRepository);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/auth/me");
        request.setCookies(new Cookie(TokenService.ACCESS_TOKEN_COOKIE, jwt));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("morador", SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
