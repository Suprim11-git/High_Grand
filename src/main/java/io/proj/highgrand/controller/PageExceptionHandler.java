package io.proj.highgrand.controller;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@ControllerAdvice(basePackages = "io.proj.highgrand.controller")
public class PageExceptionHandler {

    private static String enc(String s) {
        return URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
    }

    @ExceptionHandler({MaxUploadSizeExceededException.class})
    public RedirectView handleTooLarge(MaxUploadSizeExceededException ex) {
        return new RedirectView("/admin/add_products.html?error=" + enc("Image exceeds the upload limit. Please choose a smaller image."), false);
    }

    @ExceptionHandler({MultipartException.class})
    public RedirectView handleMultipart(MultipartException ex) {
        return new RedirectView("/admin/add_products.html?error=" + enc("Upload error. Please try selecting the image again."), false);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public RedirectView handleBadRequest(Exception ex, RedirectAttributes attrs) {
        return new RedirectView("/admin/add_products.html?error=" + enc(ex.getMessage()), false);
    }

    @ExceptionHandler({Exception.class})
    public RedirectView handleUnexpected(Exception ex) {
        String msg = ex.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = "An error occurred while saving product data. Please try again.";
        }
        return new RedirectView("/admin/add_products.html?error=" + enc(msg), false);
    }
}
