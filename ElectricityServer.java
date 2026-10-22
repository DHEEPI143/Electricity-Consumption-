import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class ElectricityServer {

public static void main(String[] args) throws IOException {

    HttpServer server = HttpServer.create(
        new InetSocketAddress(8080), 0
    );

    server.createContext("/calculate", exchange -> {

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Origin", "*"
        );

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Methods", "GET, OPTIONS"
        );

        exchange.getResponseHeaders().set(
            "Access-Control-Allow-Headers", "Content-Type"
        );

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            return;
        }

        try {
            String query = exchange.getRequestURI().getRawQuery();

            if (query == null) {
                sendResponse(exchange, 400, "{\"error\":\"Missing readings\"}");
                return;
            }

            double previous = getValue(query, "previous");
            double current = getValue(query, "current");
            double tariff = getValue(query, "tariff");

            if (!Double.isFinite(previous) ||
                !Double.isFinite(current) ||
                !Double.isFinite(tariff) ||
                previous < 0 || current < previous || tariff < 0) {

                sendResponse(exchange, 400,
                    "{\"error\":\"Please enter valid readings\"}");
                return;
            }

            double units = current - previous;
            double bill = units * tariff;

            String status = units > 50
                ? "High Usage"
                : "Normal";

            String json = String.format(
                java.util.Locale.US,
                "{\"units\":%.2f,\"bill\":%.2f,\"status\":\"%s\"}",
                units, bill, status
            );

            sendResponse(exchange, 200, json);

        } catch (Exception e) {
            sendResponse(exchange, 400,
                "{\"error\":\"Invalid input values\"}");
        }
    });

    server.start();

    System.out.println("Electricity Analyzer Java Server Started!");
    System.out.println("Server URL: http://localhost:8080");
    System.out.println("Keep this terminal open while testing.");
}

private static double getValue(String query, String key) {
    for (String item : query.split("&")) {
        String[] pair = item.split("=", 2);

        if (pair.length == 2 && pair[0].equals(key)) {
            return Double.parseDouble(
                java.net.URLDecoder.decode(
                    pair[1], StandardCharsets.UTF_8
                )
            );
        }
    }

    throw new IllegalArgumentException("Missing " + key);
}

private static void sendResponse(
    HttpExchange exchange, int statusCode, String response
) throws IOException {

    byte[] bytes = response.getBytes(StandardCharsets.UTF_8);

    exchange.getResponseHeaders().set(
        "Content-Type", "application/json; charset=UTF-8"
    );

    exchange.sendResponseHeaders(statusCode, bytes.length);

    try (OutputStream os = exchange.getResponseBody()) {
        os.write(bytes);
    }
}

}