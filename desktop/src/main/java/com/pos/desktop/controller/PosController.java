package com.pos.desktop.controller;

import com.pos.desktop.model.CartItem;
import com.pos.desktop.model.Product;
import com.pos.desktop.model.Sale;
import com.pos.desktop.service.ProductService;
import com.pos.desktop.service.SaleService;
import com.pos.desktop.service.SessionService;
import com.pos.desktop.util.AlertUtil;
import com.pos.desktop.util.CurrencyUtil;
import com.pos.desktop.util.ReceiptPrinter;
import javafx.application.Platform;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.input.KeyCode;
import javafx.scene.layout.GridPane;

import java.net.URL;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.ResourceBundle;

/**
 * POS Screen Controller — handles product search, cart, and checkout.
 * Uses MVVM-lite: controller manages state + delegates to services.
 */
public class PosController implements Initializable {

    // FXML bindings
    @FXML private TextField searchField;
    @FXML private TextField barcodeField;
    @FXML private ListView<Product> productListView;
    @FXML private TableView<CartItem> cartTable;
    @FXML private TableColumn<CartItem, String>  colName;
    @FXML private TableColumn<CartItem, Double>  colPrice;
    @FXML private TableColumn<CartItem, Integer> colQty;
    @FXML private TableColumn<CartItem, Double>  colTotal;
    @FXML private Label labelSubtotal;
    @FXML private Label labelTax;
    @FXML private Label labelTotal;
    @FXML private ComboBox<String> paymentMethodCombo;
    @FXML private TextField tenderedField;
    @FXML private Label labelChange;
    @FXML private Button btnCheckout;
    @FXML private Label statusLabel;

    private final ProductService productService = new ProductService();
    private final SaleService saleService = new SaleService();
    private final ObservableList<CartItem> cartItems = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        setupCartTable();
        setupProductList();
        setupPaymentSection();
        setupSearchListeners();
        updateTotals();
    }

    // ---- Setup ----
    private void setupCartTable() {
        colName.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getProductName()));
        colPrice.setCellValueFactory(c -> new SimpleDoubleProperty(c.getValue().getUnitPrice()).asObject());
        colQty.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getQuantity()).asObject());
        colTotal.setCellValueFactory(c -> new SimpleDoubleProperty(c.getValue().getLineTotal()).asObject());

        colPrice.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(Double v, boolean empty) {
                super.updateItem(v, empty);
                setText(empty || v == null ? null : CurrencyUtil.format(v));
            }
        });
        colTotal.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(Double v, boolean empty) {
                super.updateItem(v, empty);
                setText(empty || v == null ? null : CurrencyUtil.format(v));
            }
        });

        cartTable.setItems(cartItems);
        cartTable.setPlaceholder(new Label("Cart is empty — search for a product to begin"));

        // Double-click to increase qty
        cartTable.setRowFactory(tv -> {
            TableRow<CartItem> row = new TableRow<>();
            row.setOnMouseClicked(e -> {
                if (e.getClickCount() == 2 && !row.isEmpty()) {
                    incrementCartItem(row.getItem());
                }
            });
            return row;
        });
    }

    private void setupProductList() {
        productListView.setCellFactory(lv -> new ListCell<>() {
            @Override protected void updateItem(Product p, boolean empty) {
                super.updateItem(p, empty);
                if (empty || p == null) { setText(null); }
                else { setText(p.getName() + " — " + CurrencyUtil.format(p.getSellingPrice())
                    + "  [Stock: " + p.getStockQuantity() + "]"); }
            }
        });

        productListView.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) addSelectedProductToCart();
        });

        loadProducts(null);
    }

    private void setupPaymentSection() {
        paymentMethodCombo.setItems(FXCollections.observableArrayList("CASH", "CARD", "MPESA"));
        paymentMethodCombo.getSelectionModel().selectFirst();

        tenderedField.textProperty().addListener((obs, old, val) -> updateChange());
    }

    private void setupSearchListeners() {
        searchField.textProperty().addListener((obs, old, val) -> loadProducts(val));

        barcodeField.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.ENTER) {
                addByBarcode(barcodeField.getText().trim());
                barcodeField.clear();
            }
        });
    }

    // ---- Product actions ----
    private void loadProducts(String search) {
        try {
            List<Product> products = productService.searchProducts(search, true);
            productListView.setItems(FXCollections.observableArrayList(products));
        } catch (SQLException e) {
            setStatus("Error loading products: " + e.getMessage(), true);
        }
    }

    @FXML
    private void addSelectedProductToCart() {
        Product selected = productListView.getSelectionModel().getSelectedItem();
        if (selected != null) addToCart(selected, 1);
    }

    private void addByBarcode(String barcode) {
        if (barcode.isEmpty()) return;
        try {
            Optional<Product> product = productService.findByBarcode(barcode);
            if (product.isPresent()) {
                addToCart(product.get(), 1);
            } else {
                setStatus("No product found for barcode: " + barcode, true);
            }
        } catch (SQLException e) {
            setStatus("Error looking up barcode", true);
        }
    }

    private void addToCart(Product product, int quantity) {
        if (product.getStockQuantity() <= 0) {
            AlertUtil.warn("Out of Stock", product.getName() + " is out of stock.");
            return;
        }

        // Check if already in cart
        Optional<CartItem> existing = cartItems.stream()
            .filter(i -> i.getProductId().equals(product.getId()))
            .findFirst();

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQty = item.getQuantity() + quantity;
            if (newQty > product.getStockQuantity()) {
                AlertUtil.warn("Stock Limit", "Only " + product.getStockQuantity() + " units available.");
                return;
            }
            item.setQuantity(newQty);
            item.recalculate();
        } else {
            CartItem item = CartItem.from(product, quantity);
            cartItems.add(item);
        }

        cartTable.refresh();
        updateTotals();
        setStatus("Added: " + product.getName(), false);
    }

    private void incrementCartItem(CartItem item) {
        try {
            Product product = productService.findById(item.getProductId()).orElse(null);
            if (product != null && item.getQuantity() < product.getStockQuantity()) {
                item.setQuantity(item.getQuantity() + 1);
                item.recalculate();
                cartTable.refresh();
                updateTotals();
            }
        } catch (SQLException e) {
            setStatus("Stock check failed", true);
        }
    }

    @FXML
    private void removeCartItem() {
        CartItem selected = cartTable.getSelectionModel().getSelectedItem();
        if (selected != null) {
            cartItems.remove(selected);
            updateTotals();
        }
    }

    @FXML
    private void clearCart() {
        if (cartItems.isEmpty()) return;
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION, "Clear the entire cart?", ButtonType.YES, ButtonType.NO);
        confirm.setHeaderText(null);
        confirm.showAndWait().filter(b -> b == ButtonType.YES).ifPresent(b -> {
            cartItems.clear();
            updateTotals();
        });
    }

    // ---- Totals ----
    private void updateTotals() {
        double subtotal = cartItems.stream().mapToDouble(i -> i.getUnitPrice() * i.getQuantity()).sum();
        double tax      = cartItems.stream().mapToDouble(CartItem::getTaxAmount).sum();
        double discount = cartItems.stream().mapToDouble(CartItem::getDiscount).sum();
        double total    = subtotal + tax - discount;

        labelSubtotal.setText(CurrencyUtil.format(subtotal));
        labelTax.setText(CurrencyUtil.format(tax));
        labelTotal.setText(CurrencyUtil.format(total));

        updateChange();
    }

    private void updateChange() {
        try {
            double tendered = Double.parseDouble(tenderedField.getText().trim());
            double total    = cartItems.stream().mapToDouble(CartItem::getLineTotal).sum();
            double change   = Math.max(0, tendered - total);
            labelChange.setText(CurrencyUtil.format(change));
        } catch (NumberFormatException e) {
            labelChange.setText(CurrencyUtil.format(0));
        }
    }

    // ---- Checkout ----
    @FXML
    private void handleCheckout() {
        if (cartItems.isEmpty()) {
            AlertUtil.warn("Empty Cart", "Please add products before checking out.");
            return;
        }

        String paymentMethod = paymentMethodCombo.getValue();
        double total = cartItems.stream().mapToDouble(CartItem::getLineTotal).sum();

        double amountTendered;
        try {
            String tenderedText = tenderedField.getText().trim();
            amountTendered = tenderedText.isEmpty() ? total : Double.parseDouble(tenderedText);
        } catch (NumberFormatException e) {
            AlertUtil.error("Invalid Amount", "Please enter a valid amount tendered.");
            return;
        }

        if ("CASH".equals(paymentMethod) && amountTendered < total) {
            AlertUtil.warn("Insufficient Amount", "Tendered amount is less than total.");
            return;
        }

        btnCheckout.setDisable(true);
        try {
            String cashierId = SessionService.getInstance().getCurrentUser().getId();
            Sale sale = saleService.processSale(List.copyOf(cartItems), paymentMethod, amountTendered, cashierId);

            // Show receipt
            showReceiptDialog(sale);

            // Clear cart
            cartItems.clear();
            tenderedField.clear();
            updateTotals();
            setStatus("Sale " + sale.getReceiptNumber() + " completed!", false);

        } catch (SaleService.SaleException e) {
            AlertUtil.error("Sale Failed", e.getMessage());
        } finally {
            btnCheckout.setDisable(false);
        }
    }

    private void showReceiptDialog(Sale sale) {
        String receipt = ReceiptPrinter.buildReceiptText(sale);
        TextArea ta = new TextArea(receipt);
        ta.setEditable(false);
        ta.setStyle("-fx-font-family: 'Courier New'; -fx-font-size: 12;");
        ta.setPrefSize(380, 500);

        Dialog<ButtonType> dialog = new Dialog<>();
        dialog.setTitle("Receipt — " + sale.getReceiptNumber());
        dialog.getDialogPane().setContent(ta);
        dialog.getDialogPane().getButtonTypes().addAll(
            new ButtonType("Print", ButtonBar.ButtonData.OK_DONE),
            new ButtonType("Close", ButtonBar.ButtonData.CANCEL_CLOSE)
        );
        dialog.showAndWait().ifPresent(btn -> {
            if (btn.getButtonData() == ButtonBar.ButtonData.OK_DONE) {
                ReceiptPrinter.print(sale);
            }
        });
    }

    // ---- Utilities ----
    private void setStatus(String msg, boolean error) {
        Platform.runLater(() -> {
            statusLabel.setText(msg);
            statusLabel.setStyle("-fx-text-fill: " + (error ? "#ef4444" : "#10b981") + ";");
        });
    }
}
