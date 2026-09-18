package io.proj.highgrand.repository;

import io.proj.highgrand.entity.Order;
import io.proj.highgrand.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByOrderDateDesc();

    List<Order> findByUserOrderByOrderDateDesc(User user);
}