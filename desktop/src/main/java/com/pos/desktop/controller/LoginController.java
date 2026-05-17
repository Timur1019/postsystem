package com.pos.desktop.controller;

import com.pos.desktop.service.AuthService;
import com.pos.desktop.service.SessionService;
import com.pos.desktop.util.ViewManager;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;

import java.net.URL;
import java.util.ResourceBundle;

public class LoginController implements Initializable {

    @FXML private TextField     usernameField;
    @FXML private PasswordField passwordField;
    @FXML private Label         errorLabel;
    @FXML private Button        loginButton;

    private final AuthService authService = new AuthService();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // If already logged in, go straight to POS
        if (SessionService.getInstance().isLoggedIn()) {
            Platform.runLater(() -> ViewManager.navigate("pos"));
        }
    }

    @FXML
    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.getText();

        if (username.isEmpty() || password.isEmpty()) {
            showError("Please enter username and password");
            return;
        }

        loginButton.setDisable(true);
        loginButton.setText("Signing in…");
        hideError();

        // Run auth on a background thread to avoid blocking the UI
        new Thread(() -> {
            try {
                authService.login(username, password);
                Platform.runLater(() -> ViewManager.navigate("pos"));
            } catch (AuthService.AuthException e) {
                Platform.runLater(() -> {
                    showError(e.getMessage());
                    passwordField.clear();
                    loginButton.setDisable(false);
                    loginButton.setText("Sign In");
                });
            }
        }).start();
    }

    private void showError(String msg) {
        errorLabel.setText(msg);
        errorLabel.setVisible(true);
        errorLabel.setManaged(true);
    }

    private void hideError() {
        errorLabel.setVisible(false);
        errorLabel.setManaged(false);
    }
}
