package br.gov.rs.canoas.bettercanoas.domain.inimigo;

import br.gov.rs.canoas.bettercanoas.domain.status.StatusInimigo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InimigoRepository extends JpaRepository<Inimigo, Long> {
    Optional<Inimigo> findByBairroId(Long bairroId);

    List<Inimigo> findByStatus(StatusInimigo statusInimigo);
}