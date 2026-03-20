package com.cookmate.service;

import com.cookmate.dto.AuthRequest;
import com.cookmate.dto.AuthResponse;
import com.cookmate.entity.User;
import com.cookmate.repository.UserRepository;
import com.cookmate.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse signup(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName() == null || request.getName().isBlank() ? "Student" : request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getEmail());
        return AuthResponse.builder().token(token).email(savedUser.getEmail()).name(savedUser.getName()).build();
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail());
        return AuthResponse.builder().token(token).email(user.getEmail()).name(user.getName()).build();
    }
}
