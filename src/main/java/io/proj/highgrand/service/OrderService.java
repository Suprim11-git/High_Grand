package io.proj.highgrand.service;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.User;
import io.proj.highgrand.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<Order> findAll() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    @Transactional(readOnly = true)
    public List<Order> findByUser(User user) {
        return orderRepository.findByUserOrderByOrderDateDesc(user);
    }

    @Transactional(readOnly = true)
    public Order getById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found: " + id));
    }

    public Order createOrder(
            User user,
            String customerName,
            String customerEmail,
            String customerPhone,
            String shippingAddress,
            String city,
            String postalCode,
            String itemsSummary,
            Integer itemCount,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal tax,
            BigDecimal totalAmount,
            String paymentMethod,
            String notes) {

        Order order = new Order();

        order.setUser(user);
        order.setCustomerName(customerName);
        order.setCustomerEmail(customerEmail);
        order.setCustomerPhone(customerPhone);

        order.setShippingAddress(shippingAddress);
        order.setCity(city);
        order.setPostalCode(postalCode);

        order.setItemsSummary(itemsSummary);
        order.setItemCount(itemCount);

        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setTax(tax);
        order.setTotalAmount(totalAmount);

        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("Pending");

        order.setStatus("Processing");
        order.setTrackingNumber(null);

        LocalDateTime now = LocalDateTime.now();
        order.setOrderDate(now);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        order.setOrderNumber(
                "HG-" + System.currentTimeMillis()
        );

        order.setNotes(notes);

        return orderRepository.save(order);
    }

    public Order updateStatus(
            Long id,
            String status,
            String trackingNumber) {

        Order order = getById(id);

        if (status != null && !status.isBlank()) {
            order.setStatus(status);
        }

        if (trackingNumber != null && !trackingNumber.isBlank()) {
            order.setTrackingNumber(trackingNumber);
        }

        order.setUpdatedAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {

        Order order = getById(id);

        orderRepository.delete(order);
    }

    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }
}