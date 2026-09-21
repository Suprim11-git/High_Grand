package io.proj.highgrand.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTestEmail(String to) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("High Grand - SMTP Test");
        message.setText(
                "Hello!\n\n" +
                        "This is a test email from the High Grand project.\n\n" +
                        "SMTP is working successfully!\n\n" +
                        "High Grand Team"
        );

        mailSender.send(message);
    }

    public void sendRegistrationEmail(String to, String name) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Welcome to High Grand!");

        message.setText(
                "Hello " + name + ",\n\n" +
                        "Welcome to High Grand!\n\n" +
                        "Your account has been successfully created.\n\n" +
                        "You can now log in to your High Grand account and start shopping.\n\n" +
                        "Thank you for joining us!\n\n" +
                        "Best regards,\n" +
                        "High Grand Team"
        );

        mailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String name, String token) {

        String resetLink =
                "http://localhost:8080/pages/auth/reset-password.html?token="
                        + token;

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("High Grand - Reset Your Password");

        message.setText(
                "Hello " + name + ",\n\n" +
                        "We received a request to reset your High Grand account password.\n\n" +
                        "Click the link below to reset your password:\n\n" +
                        resetLink + "\n\n" +
                        "This link will expire in 30 minutes.\n\n" +
                        "If you did not request a password reset, you can safely ignore this email.\n\n" +
                        "Best regards,\n" +
                        "High Grand Team"
        );

        mailSender.send(message);
    }
}