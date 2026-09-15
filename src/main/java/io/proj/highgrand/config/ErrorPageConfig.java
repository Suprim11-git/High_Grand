package io.proj.highgrand.config;

import org.springframework.boot.web.error.ErrorPage;
import org.springframework.boot.web.error.ErrorPageRegistrar;
import org.springframework.boot.web.error.ErrorPageRegistry;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

@Configuration
public class ErrorPageConfig implements ErrorPageRegistrar {

    @Override
    public void registerErrorPages(ErrorPageRegistry registry) {
        registry.addErrorPages(
                new ErrorPage(HttpStatus.BAD_REQUEST,
                        "/admin/error.html?title=Bad+Request&msg=The+request+was+invalid.+Please+go+back+and+try+again."),
                new ErrorPage(HttpStatus.PAYLOAD_TOO_LARGE,
                        "/admin/error.html?title=Image+Too+Large&msg=The+selected+image+exceeds+the+5+MB+upload+limit.&hint=Compress+or+resize+the+image,+then+try+again."),
                new ErrorPage(HttpStatus.NOT_FOUND,
                        "/admin/error.html?title=Page+Not+Found&msg=The+page+you+are+looking+for+does+not+exist."),
                new ErrorPage(HttpStatus.INTERNAL_SERVER_ERROR,
                        "/admin/error.html?title=Unexpected+Error&msg=Something+went+wrong+on+the+server.+Please+try+again."),
                new ErrorPage(Throwable.class,
                        "/admin/error.html?title=Unexpected+Error&msg=Something+went+wrong.+Please+try+again."));
    }
}
