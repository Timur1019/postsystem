package com.pos.desktop.util;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised FXML scene switching.
 */
public class ViewManager {

    private static final Logger log = LoggerFactory.getLogger(ViewManager.class);
    private static Stage primaryStage;
    private static final Map<String, Parent> viewCache = new HashMap<>();

    public static void init(Stage stage) {
        primaryStage = stage;
    }

    public static void navigate(String viewName) {
        try {
            Parent root = viewCache.computeIfAbsent(viewName, k -> {
                try {
                    FXMLLoader loader = new FXMLLoader(
                        ViewManager.class.getResource("/fxml/" + k + ".fxml")
                    );
                    return loader.load();
                } catch (IOException e) {
                    throw new RuntimeException("Cannot load view: " + k, e);
                }
            });

            Scene scene = primaryStage.getScene();
            if (scene == null) {
                scene = new Scene(root);
                scene.getStylesheets().add(
                    ViewManager.class.getResource("/css/style.css").toExternalForm()
                );
                primaryStage.setScene(scene);
            } else {
                scene.setRoot(root);
            }

            log.debug("Navigated to view: {}", viewName);
        } catch (Exception e) {
            log.error("Navigation failed for: {}", viewName, e);
            AlertUtil.error("Navigation Error", "Cannot load view: " + viewName);
        }
    }

    public static void invalidateCache(String viewName) {
        viewCache.remove(viewName);
    }

    public static Stage getPrimaryStage() {
        return primaryStage;
    }
}
