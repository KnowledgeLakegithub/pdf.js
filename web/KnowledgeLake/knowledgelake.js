"use strict";

import { messageHandlerBuilder } from "./messageHandler";

function isBlob(toTest) {
    return toTest instanceof Blob && typeof(toTest) == 'object' && toTest.size != undefined && toTest.type != undefined && typeof(toTest.type) == 'string';
}

var handler = messageHandlerBuilder.Child();


function blobToUint8Array(blob) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = function() {
            var arraybuffer = this.result;
            var uint8array = new Uint8Array(arraybuffer);
            resolve(uint8array);
        };
        fr.readAsArrayBuffer(blob);
    });
}


function renderPDF(data) {
    return new Promise((resolve, reject) => {
        PDFViewerApplication.open(data)
                .then(() => {
                    resolve();
                })
                .catch((e) => {
                    reject(e);
                });
    });
}

window.currentPDFWidgets = {};

/**
 * Listens for updates to annotations
 */
window.onWidgetUpdate = function(key, value, publish) {
    if (publish === void 0) { publish = true; }

    if (key != undefined || value != undefined) {
        //console.log(key + ": " + value);
        window.currentPDFWidgets[key] = value;
    }

    if (publish)
        handler.Send('pdfjs-annotation-update', window.currentPDFWidgets);
}



/**
 * This is triggered in viewer.js when everything is ready
 */
window.StartListeningForPostMessages = function(eventBus) {
    // When the pages are ready, get a base for all annotations
    eventBus.on('pagesloaded', () => {
        window.currentPDFWidgets = {};
        getInitialFormData();
    });


    // Listen for receiving something to display
    handler.Listen('pdfjs-display', (msgData) => {
        if (typeof(msgData) == 'string') {
            // String (URL)
            return PDFViewerApplication.open(msgData);
        }
        else if (Array.isArray(msgData)) {
            // Byte array
            return PDFViewerApplication.open(msgData);
        }
        else if (isBlob(msgData)) {
            // Render a blob
            return blobToUint8Array(msgData)
                .then((blob) => { return renderPDF(blob); });
        }
    });


    // Listen for request to get the PDF form data
    handler.Listen('pdfjs-get-form-data', () => {
        return window.currentPDFWidgets;
    });
}


/**
 * Gets all annotations for the document
 */
function getInitialFormData(){
    var totalPages = PDFViewerApplication.pagesCount;

    var allAnnotations = [];

    // Get annotations for each page
    var innerResolve = null;
    var innerProm = new Promise((resolve, reject) => { innerResolve = resolve; });

    for (let i = 0; i < totalPages; i++) {
        innerProm = innerProm.then(() => {
            return PDFViewerApplication.pdfViewer.getPageView(i).pdfPage.getAnnotations()
                    .then((annotations) => {
                        allAnnotations = allAnnotations.concat(annotations);
                    });
        });
    }

    var invalidTypes = ["Link"];

    innerProm.then(() => {
        // Filter through annotations and only take widgets
        for (let i = 0; i < allAnnotations.length; i++) {
            let annotation = allAnnotations[i];
            if (annotation.fieldName == undefined)
                continue;

            if (annotation.annotationType != 20 /* Widget */)
                continue;

            if (invalidTypes.indexOf(annotation.subtype) != -1 || invalidTypes.indexOf(annotation.fieldType) != -1)
                continue;

            window.onWidgetUpdate(annotation.fieldName, annotation.fieldValue, false);
        }

        window.onWidgetUpdate(undefined, undefined); // Publish annotations
    });
    innerResolve();
}

