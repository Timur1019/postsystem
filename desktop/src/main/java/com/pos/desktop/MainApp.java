package com.pos.desktop;

import com.pos.desktop.dao.DatabaseManager;
import com.pos.desktop.util.ViewManager;
import javafx.application.Application;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MainApp extends Application {

    private static final Logger log = LoggerFactory.getLogger(MainApp.class);

    @Override
    public void start(Stage primaryStage) throws Exception {
        log.info("Starting POS Desktop v1.0");

        // Initialize database
        DatabaseManager.getInstance().initialize();

        // Configure primary stage
        primaryStage.setTitle("RetailPOS Desktop");
        primaryStage.setMinWidth(1024);
        primaryStage.setMinHeight(768);
        primaryStage.setWidth(1280);
        primaryStage.setHeight(800);

        // Wire ViewManager to the stage
        ViewManager.init(primaryStage);

        // Show login screen
        ViewManager.navigate("login");

        primaryStage.show();
    }

    @Override
    public void stop() {
        DatabaseManager.getInstance().shutdown();
        log.info("POS Desktop stopped");
    }

    public static void main(String[] args) {
        launch(args);
    }
}
