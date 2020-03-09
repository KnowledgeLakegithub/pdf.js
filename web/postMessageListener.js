"use strict";

import { messageHandlerBuilder } from "./messageHandler";

var handler = messageHandlerBuilder.Child();


window.StartListeningForPostMessages = function() {


    handler.Listen('pdfjs-display', (data) => {
        return new Promise((resolve, reject) => {
            PDFViewerApplication.open(data, 0)
                .then(() => {
                    console.log("DONE");
                    resolve();
                })
                .catch((e) => {
                    reject(e);
                });
        });
    });
}

window.addEventListener('pdfjs-ready', function() {



    /*
    window.addEventListener('message', (e) => {
        if (e.origin != window.origin)
            return;

        let uri = e.data;

        PDFViewerApplication.open(uri, 0)
            .then((a) => {
                console.log(a);
                console.log(PDFViewerApplication);

            });

    });*/
});

