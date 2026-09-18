package io.proj.highgrand.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping({"/", "/signup"})
    public String root() {
        return "redirect:/pages/auth/signup.html";
    }

    @GetMapping({"/home", "/index"})
    public String home() {
        return "forward:/Home.html";
    }
}
