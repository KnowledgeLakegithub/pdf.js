/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

function noElement() {
  return document.createElement('div');
}


if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("CHROME")) {
  var defaultUrl; // eslint-disable-line no-var

  (function rewriteUrlClosure() {
    // Run this code outside DOMContentLoaded to make sure that the URL
    // is rewritten as soon as possible.
    const queryString = document.location.search.slice(1);
    const m = /(^|&)file=([^&]*)/.exec(queryString);
    defaultUrl = m ? decodeURIComponent(m[2]) : "";

    // Example: chrome-extension://.../http://example.com/file.pdf
    const humanReadableUrl = "/" + defaultUrl + location.hash;
    history.replaceState(history.state, "", humanReadableUrl);
    if (top === window) {
      // eslint-disable-next-line no-undef
      chrome.runtime.sendMessage("showPageAction");
    }
  })();
}

let pdfjsWebApp, pdfjsWebAppOptions;
if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("PRODUCTION")) {
  pdfjsWebApp = require("./app.js");
  pdfjsWebAppOptions = require("./app_options.js");
}

if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
  require("./firefoxcom.js");
  require("./firefox_print_service.js");
}
if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC")) {
  require("./genericcom.js");
}
if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("CHROME")) {
  require("./chromecom.js");
}
if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("CHROME || GENERIC")) {
  require("./pdf_print_service.js");
}


function getViewerConfiguration() {
  return {
    appContainer: document.body,
    mainContainer: document.getElementById('viewerContainer'),
    viewerContainer: document.getElementById('viewer'),
    eventBus: null,
    toolbar: {
        container: document.getElementById('toolbarViewer'),
        numPages: document.getElementById('numPages'),
        pageNumber: document.getElementById('pageNumber'),
        scaleSelectContainer: document.getElementById('scaleSelectContainer'),
        scaleSelect: document.getElementById('scaleSelect'),
        customScaleOption: document.getElementById('customScaleOption'),
        previous: document.getElementById('previous'),
        next: document.getElementById('next'),
        zoomIn: document.getElementById('zoomIn'),
        zoomOut: document.getElementById('zoomOut'),
        viewFind: noElement(), //document.getElementById('viewFind'),
        openFile: noElement(), //document.getElementById('openFile'),
        print: noElement(), //document.getElementById('print'),
        presentationModeButton: noElement(), //document.getElementById('presentationMode'),
        download: noElement(), //document.getElementById('download'),
        viewBookmark: noElement(), //document.getElementById('viewBookmark'),


    },
    secondaryToolbar: {
        toolbar: noElement(), //document.getElementById('secondaryToolbar'),
        toggleButton: noElement(), //document.getElementById('secondaryToolbarToggle'),
        toolbarButtonContainer: noElement(), //document.getElementById('secondaryToolbarButtonContainer'),
        presentationModeButton: noElement(), //document.getElementById('secondaryPresentationMode'),
        openFileButton: noElement(), //document.getElementById('secondaryOpenFile'),
        printButton: noElement(), //document.getElementById('secondaryPrint'),
        downloadButton: noElement(), //document.getElementById('secondaryDownload'),
        viewBookmarkButton: noElement(), //document.getElementById('secondaryViewBookmark'),
        firstPageButton: noElement(), //document.getElementById('firstPage'),
        lastPageButton: noElement(), //document.getElementById('lastPage'),

        pageRotateCwButton: document.getElementById('pageRotateCw'),
        pageRotateCcwButton: document.getElementById('pageRotateCcw'),

        cursorSelectToolButton: document.getElementById('cursorSelectTool'),
        cursorHandToolButton: document.getElementById('cursorHandTool'),

        scrollVerticalButton: noElement(), //document.getElementById('scrollVertical'),
        scrollHorizontalButton: noElement(), //document.getElementById('scrollHorizontal'),
        scrollWrappedButton: noElement(), //document.getElementById('scrollWrapped'),
        spreadNoneButton: noElement(), //document.getElementById('spreadNone'),
        spreadOddButton: noElement(), //document.getElementById('spreadOdd'),
        spreadEvenButton: noElement(), //document.getElementById('spreadEven'),
        documentPropertiesButton: noElement(), //document.getElementById('documentProperties')
    },
    fullscreen: {
        contextFirstPage: noElement(), //document.getElementById('contextFirstPage'),
        contextLastPage: noElement(), //document.getElementById('contextLastPage'),
        contextPageRotateCw: document.getElementById('contextPageRotateCw'),
        contextPageRotateCcw: document.getElementById('contextPageRotateCcw')
    },
    sidebar: {
        outerContainer: noElement(), //document.getElementById('outerContainer'),
        viewerContainer: noElement(), //document.getElementById('viewerContainer'),
        toggleButton: noElement(), //document.getElementById('sidebarToggle'),
        thumbnailButton: noElement(), //document.getElementById('viewThumbnail'),
        outlineButton: noElement(), //document.getElementById('viewOutline'),
        attachmentsButton: noElement(), //document.getElementById('viewAttachments'),
        thumbnailView: noElement(), //ocument.getElementById('thumbnailView'),
        outlineView: noElement(), //document.getElementById('outlineView'),
        attachmentsView: noElement(), //document.getElementById('attachmentsView')
    },
    sidebarResizer: {
        outerContainer: noElement(), //document.getElementById('outerContainer'),
        resizer: noElement(), //document.getElementById('sidebarResizer')
    },
    findBar: {
        bar: document.getElementById('findbar'),
        toggleButton: document.getElementById('viewFind'),
        findField: document.getElementById('findInput'),
        highlightAllCheckbox: document.getElementById('findHighlightAll'),
        caseSensitiveCheckbox: document.getElementById('findMatchCase'),
        entireWordCheckbox: document.getElementById('findEntireWord'),
        findMsg: document.getElementById('findMsg'),
        findResultsCount: document.getElementById('findResultsCount'),
        findPreviousButton: document.getElementById('findPrevious'),
        findNextButton: document.getElementById('findNext')
    },
    passwordOverlay: {
        overlayName: 'passwordOverlay',
        container: document.getElementById('passwordOverlay'),
        label: document.getElementById('passwordText'),
        input: document.getElementById('password'),
        submitButton: document.getElementById('passwordSubmit'),
        cancelButton: document.getElementById('passwordCancel')
    },
    documentProperties: {
        overlayName: 'documentPropertiesOverlay',
        container: document.getElementById('documentPropertiesOverlay'),
        closeButton: document.getElementById('documentPropertiesClose'),
        fields: {
            'fileName': document.getElementById('fileNameField'),
            'fileSize': document.getElementById('fileSizeField'),
            'title': document.getElementById('titleField'),
            'author': document.getElementById('authorField'),
            'subject': document.getElementById('subjectField'),
            'keywords': document.getElementById('keywordsField'),
            'creationDate': document.getElementById('creationDateField'),
            'modificationDate': document.getElementById('modificationDateField'),
            'creator': document.getElementById('creatorField'),
            'producer': document.getElementById('producerField'),
            'version': document.getElementById('versionField'),
            'pageCount': document.getElementById('pageCountField'),
            'pageSize': document.getElementById('pageSizeField'),
            'linearized': document.getElementById('linearizedField')
        }
    },
    errorWrapper: {
        container: document.getElementById('errorWrapper'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.getElementById('errorClose'),
        errorMoreInfo: document.getElementById('errorMoreInfo'),
        moreInfoButton: document.getElementById('errorShowMore'),
        lessInfoButton: document.getElementById('errorShowLess')
    },
    printContainer: document.getElementById('printContainer'),
    openFileInputName: 'fileInput',
    debuggerScriptPath: './debugger.js'
  };
}

function webViewerLoad() {
  var config = getViewerConfiguration();
  if (typeof PDFJSDev === "undefined" || !PDFJSDev.test("PRODUCTION")) {
    Promise.all([
      SystemJS.import("pdfjs-web/app.js"),
      SystemJS.import("pdfjs-web/app_options.js"),
      SystemJS.import("ui_utils.js"),
      SystemJS.import("pdfjs-web/genericcom.js"),
      SystemJS.import("pdfjs-web/pdf_print_service.js"),
    ]).then(function([app, appOptions, uiUtils, ...otherModules]) {
      config.eventBus = new uiUtils.EventBus({ dispatchToDOM: appOptions.AppOptions.get("eventBusDispatchToDOM") });

      window.PDFViewerApplication = app.PDFViewerApplication;
      window.PDFViewerApplicationOptions = appOptions.AppOptions;
      app.PDFViewerApplication.run(config);

      StartListeningForPostMessages(config.eventBus);

      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("webviewerloaded", true, true, {});
      document.dispatchEvent(event);
    });
  } else {
    var uiUtils = require("./ui_utils");
    config.eventBus = new uiUtils.EventBus({ dispatchToDOM: false });

    if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("CHROME")) {
      pdfjsWebAppOptions.AppOptions.set("defaultUrl", defaultUrl);
    }

    window.PDFViewerApplication = pdfjsWebApp.PDFViewerApplication;
    window.PDFViewerApplicationOptions = pdfjsWebAppOptions.AppOptions;

    pdfjsWebApp.PDFViewerApplication.run(config);

    StartListeningForPostMessages(config.eventBus);

    //if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC")) {
      // Give custom implementations of the default viewer a simpler way to
      // set various `AppOptions`, by dispatching an event once all viewer
      // files are loaded but *before* the viewer initialization has run.
      const event = document.createEvent("CustomEvent");
      event.initCustomEvent("webviewerloaded", true, true, {});
      document.dispatchEvent(event);
    //}
  }
}

if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  webViewerLoad();
} else {
  document.addEventListener("DOMContentLoaded", webViewerLoad, true);
}
