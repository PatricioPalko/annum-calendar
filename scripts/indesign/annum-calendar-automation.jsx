#target "indesign"
#targetengine "session"

/*
  Annum calendar automation
  -------------------------
  Workflow:
  1. Unzip order package from admin.
  2. Run this script in Adobe InDesign.
  3. Select unzipped order folder containing order.json and photos/.
  4. Script opens template + layouts, fills photos, highlights namedays,
     inserts birthdays. Ak je zapnuty reviewPhotosBeforeExport, uprav fotky
     v otvorenom dokumente. Cmd+S (Ulozit) automaticky exportuje PDF.

  IMPORTANT:
  - Edit CONFIG paths below before first use.
  - Script silently uses CONFIG paths when the file exists (no dialog).
  - Run the script from the updated .jsx copy (Scripts Panel may hold an old file).
  - Check automation-log.txt / final alert for which .indd files were loaded.
  - Keep photos in order package under photos/.
  - order.json should contain photos[].fileName or photos[].localPath.
  - All size CONFIG values ending in Mm are converted to points for
    geometricBounds (InDesign scripting uses points).
*/

(function () {
    var SCRIPT_VERSION = "2026-08-24-v31";

    var CONFIG = {
        templatePath: "~/Desktop/annum/templates/calendar-template-2027.indd",
        coverLayoutsPath: "~/Desktop/annum/templates/cover-layouts.indd",
        layoutsPath: "~/Desktop/annum/templates/layouts.indd",
        giftIconPath: "~/Desktop/annum/assets/gift.svg",
        // Ak true, vzdy sa zobrazi dialog na vyber suboru (ignoruje existujucu cestu v CONFIG).
        alwaysPickTemplate: false,
        alwaysPickCoverLayouts: false,
        alwaysPickLayouts: false,
        // Pri opakovom behu zatvori rovnaky .indd v InDesigne a nacita ho znova z disku.
        reloadTemplateFilesFromDisk: true,
        pdfPresetName: "[Press Quality]",
        // Rok kalendara v nazve vystupneho suboru.
        calendarYear: 2027,
        closeLayoutsAfterRun: true,
        closeCalendarAfterRun: false,
        // Po vlozeni fotiek otvori paletu — upravis fotky, potom Uloz + PDF.
        reviewPhotosBeforeExport: true,

        layers: {
            photos: "AUTO_PHOTOS",
            coverGraphics: "COVER_GRAPHICS",
            coverText: "COVER_TEXT",
            namedays: "Nameday Highlights",
            birthdays: "Birthdays"
        },

        cover: {
            photoCount: 4,
            // Foto sloty v cover-layouts.indd musia byt na vrstve CONFIG.layers.photos (AUTO_PHOTOS).
            // Vrstva s logom/ciarou v cover-layouts.indd (nie AUTO_PHOTOS).
            graphicsLayerName: "COVER_GRAPHICS",
            minFrameWidthMm: 25,
            minFrameHeightMm: 25
        },

        // Mesačne layouty v layouts.indd — povodne boli sloty na beznej vrstve (nie AUTO_PHOTOS).
        monthLayouts: {
            minFrameWidthMm: 25,
            minFrameHeightMm: 25,
            // Najprv AUTO_PHOTOS (ak existuje), inak cita sloty zo strany layoutu.
            preferPhotoLayer: true
        },

        namedays: {
            colorName: "NamedayGreen",
            colorValue: [80, 255, 150],
            // ~1/3 of previous 1 mm — after mm→pt fix the bar looked ~3x taller.
            underlineHeightMm: 1 / 3,
            underlineOffsetFromBaselineMm: 0.2,
            paddingLeftMm: 0,
            paddingRightMm: 0
        },

        birthdays: {
            colorName: "BirthdayPink",
            colorValue: [252, 90, 97],
            fontName: "Manrope",
            fontStyle: "SemiBold",
            fontSize: 9,
            textWidthMm: 10,
            iconSizeMm: 4.3 / 3,
            iconGapMm: 0.5,
            // Gap after the day digit's right edge (+X = right); −Y = up from baseline.
            offsetXMm: -1.6,
            offsetYMm: 0.5,
            minDayNumberXMm: 20,
            minDayNumberPointSize: 14,
            headerZoneRatio: 0.18
        },

        // Pomer strán fotky -> kategória pre výber layoutu / frame label.
        // Frame v layouts.indd môže mať rovnaký Script Label (portrait, landscape,
        // square, panoramic, tall, any). Ak label chýba, dopočíta sa z bounds.
        orientation: {
            panoramicMin: 1.75,
            landscapeMin: 1.15,
            squareMin: 0.85,
            portraitMin: 0.65
        }
    };

    function stripDiacritics(value) {
        var map = {
            "Á":"A","Ä":"A","Č":"C","Ď":"D","É":"E","Í":"I","Ĺ":"L","Ľ":"L",
            "Ň":"N","Ó":"O","Ô":"O","Ŕ":"R","Š":"S","Ť":"T","Ú":"U","Ý":"Y","Ž":"Z",
            "á":"a","ä":"a","č":"c","ď":"d","é":"e","í":"i","ĺ":"l","ľ":"l",
            "ň":"n","ó":"o","ô":"o","ŕ":"r","š":"s","ť":"t","ú":"u","ý":"y","ž":"z"
        };
        return String(value).replace(/[ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž]/g, function (ch) {
            return map[ch] || ch;
        });
    }

    function alertAscii(message) {
        alert(stripDiacritics(message));
    }

    if (app.documents.length > 0) {
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
    }

    var orderFolder = Folder.selectDialog(stripDiacritics("Vyber rozbaleny priecinok objednavky"));
    if (!orderFolder) return;

    var orderFile = File(orderFolder.fsName + "/order.json");
    if (!orderFile.exists) {
        alertAscii("V priečinku chyba order.json:\n" + orderFolder.fsName);
        return;
    }

    var photosFolder = Folder(orderFolder.fsName + "/photos");
    if (!photosFolder.exists) {
        alertAscii("V priečinku chyba priecinok photos/:\n" + orderFolder.fsName);
        return;
    }

    var log = [];
    var calendarDoc = null;
    var layoutsDoc = null;
    var coverLayoutsDoc = null;

    try {
        installAnnumAfterSaveListener();

        var order = runStep("Nacitanie order.json", function () {
            return readJson(orderFile);
        });
        validateOrder(order);
        log.push("Automation script: " + SCRIPT_VERSION);

        var templateFile = resolveFile(
            CONFIG.templatePath,
            stripDiacritics("Vyber calendar-template-2027.indd"),
            "*.indd",
            { forceDialog: CONFIG.alwaysPickTemplate, log: log, label: "Template" }
        );
        if (!templateFile) return;

        var coverLayoutsFile = resolveFile(
            CONFIG.coverLayoutsPath,
            stripDiacritics("Vyber cover-layouts.indd"),
            "*.indd",
            { forceDialog: CONFIG.alwaysPickCoverLayouts, log: log, label: "Cover layouts" }
        );
        if (!coverLayoutsFile) return;

        var layoutsFile = resolveFile(
            CONFIG.layoutsPath,
            stripDiacritics("Vyber layouts.indd"),
            "*.indd",
            { forceDialog: CONFIG.alwaysPickLayouts, log: log, label: "Month layouts" }
        );
        if (!layoutsFile) return;

        var giftIconFile = null;
        if ((order.birthdays || []).length > 0) {
            giftIconFile = resolveFile(
                CONFIG.giftIconPath,
                stripDiacritics("Vyber ikonku darceka"),
                "*.svg;*.ai;*.pdf;*.eps;*.png"
            );
            if (!giftIconFile) return;
        }

        calendarDoc = openSourceDocument(templateFile, CONFIG.reloadTemplateFilesFromDisk);
        ensureDocumentWindow(calendarDoc);

        var outputPaths = buildOrderOutputPaths(order, orderFolder, CONFIG);
        saveCalendarToOrderFile(calendarDoc, outputPaths.indd);
        log.push(
            "Pracovny INDD v objednavke (sablona sa neprepisuje): " +
                outputPaths.indd.fsName
        );

        coverLayoutsDoc = openSourceDocument(
            coverLayoutsFile,
            CONFIG.reloadTemplateFilesFromDisk
        );
        ensureDocumentWindow(coverLayoutsDoc);

        layoutsDoc = openSourceDocument(layoutsFile, CONFIG.reloadTemplateFilesFromDisk);

        labelCalendarPages(calendarDoc);
        log.push("Stránky označené: cover + month-1 až month-12.");

        var photoResult = runStep("Vkladanie fotiek", function () {
            return fillPhotos(
                calendarDoc,
                coverLayoutsDoc,
                layoutsDoc,
                order,
                photosFolder,
                CONFIG
            );
        });
        bringLayerToFront(calendarDoc, CONFIG.layers.coverGraphics);
        bringLayerToFront(calendarDoc, CONFIG.layers.coverText);

        if ((order.dedications || []).length > 0) {
            log.push("Venovanie sa do kalendara nevklada (tlaci sa na samostatny papier).");
        }

        if (photoResult.coverDecorationLog && photoResult.coverDecorationLog.length > 0) {
            for (
                var coverLogIndex = 0;
                coverLogIndex < photoResult.coverDecorationLog.length;
                coverLogIndex++
            ) {
                log.push("Cover detail: " + photoResult.coverDecorationLog[coverLogIndex]);
            }
        }

        if (photoResult.coverDecorationsCopied === 0) {
            log.push(
                "Upozornenie: cover dekoracie sa nekopirovali (logo/ ciara). Skontroluj cover-layouts.indd a automation-log.txt."
            );
        }

        log.push(
            "Fotky vložené: cover " +
                photoResult.coverUsed +
                " (layout " +
                photoResult.coverLayoutFrameCount +
                " slotov, strana " +
                (photoResult.coverLayoutPageIndex + 1) +
                ", dekoracie " +
                photoResult.coverDecorationsCopied +
                "), mesiace " +
                photoResult.monthUsed +
                " (" +
                photoResult.monthLayoutSource +
                "), nepoužité: " +
                photoResult.unused +
                ", cover layoutov: " +
                photoResult.coverLayoutsCount +
                ", mesačných layoutov: " +
                photoResult.monthLayoutsCount +
                "."
        );

        if (photoResult.unused > 0) {
            log.push(
                "Upozornenie: " +
                    photoResult.unused +
                    " fotiek ostalo nepoužitých (viac fotiek než kapacita layoutov)."
            );
        }

        var namedayResult = highlightNamedays(calendarDoc, order.namedays || [], CONFIG);
        log.push(
            "Meniny nájdené: " +
                namedayResult.matches +
                ", zvýraznené: " +
                namedayResult.drawn +
                "."
        );

        var birthdayResult = insertBirthdays(
            calendarDoc,
            order.birthdays || [],
            giftIconFile,
            CONFIG
        );
        log.push(
            "Narodeniny vložené: " +
                birthdayResult.inserted +
                ", chyby: " +
                birthdayResult.failed +
                "."
        );
        if (birthdayResult.errors && birthdayResult.errors.length > 0) {
            for (
                var birthdayErrorIndex = 0;
                birthdayErrorIndex < birthdayResult.errors.length;
                birthdayErrorIndex++
            ) {
                log.push("Narodeniny detail: " + birthdayResult.errors[birthdayErrorIndex]);
            }
        }

        var inddOutput = outputPaths.indd;
        var pdfOutput = outputPaths.pdf;

        closeLayoutDocuments(coverLayoutsDoc, layoutsDoc, CONFIG);

        if (CONFIG.reviewPhotosBeforeExport) {
            prepareDocumentForPhotoReview(calendarDoc, CONFIG);
            registerAnnumAutoPdfOnSave(
                calendarDoc,
                pdfOutput,
                orderFolder,
                CONFIG
            );

            log.push(
                "Po kazdom ulozeni (Cmd+S) sa automaticky exportuje PDF do objednavky."
            );
            writeRunLog(orderFolder, log, []);
            showPhotoReviewPalette(
                calendarDoc,
                inddOutput,
                pdfOutput,
                CONFIG,
                log,
                orderFolder
            );
        } else {
            calendarDoc.save(inddOutput);
            log.push("INDD: " + inddOutput.fsName);

            prepareDocumentForPdfExport(calendarDoc);
            runStep("PDF export", function () {
                exportPdf(calendarDoc, pdfOutput, CONFIG.pdfPresetName);
            });
            log.push("PDF export: " + pdfOutput.fsName);
            writeRunLog(orderFolder, log, []);

            if (CONFIG.closeCalendarAfterRun && calendarDoc && calendarDoc.isValid) {
                calendarDoc.close(SaveOptions.YES);
            }

            alertAscii(
                "Hotovo.\n\nPDF bolo exportovane:\n" +
                    pdfOutput.fsName +
                    "\n\nPouzite subory:\n" +
                    formatLogLinesForAlert(log, 6)
            );
        }
    } catch (e) {
        disableAnnumAutoPdfOnSave(calendarDoc);
        closeLayoutDocuments(coverLayoutsDoc, layoutsDoc, CONFIG);
        writeRunLog(orderFolder, log, [formatScriptError(e)]);
        alertAscii("Chyba pri generovani kalendara (script " + SCRIPT_VERSION + "):\n" + formatScriptError(e));
    }

    // -----------------------------
    // CORE HELPERS
    // -----------------------------

    function closeLayoutDocuments(coverLayoutsDocRef, layoutsDocRef, config) {
        if (!config.closeLayoutsAfterRun) {
            return;
        }

        if (coverLayoutsDocRef && coverLayoutsDocRef.isValid) {
            try {
                coverLayoutsDocRef.close(SaveOptions.NO);
            } catch (e) {}
        }

        if (layoutsDocRef && layoutsDocRef.isValid) {
            try {
                layoutsDocRef.close(SaveOptions.NO);
            } catch (e) {}
        }
    }

    function prepareDocumentForPhotoReview(doc, config) {
        ensureDocumentWindow(doc);
        app.activeDocument = doc;

        var photosLayer = ensureLayer(doc, config.layers.photos);
        photosLayer.locked = false;
        photosLayer.visible = true;

        try {
            if (app.activeWindow && app.activeWindow.parent === doc) {
                app.activeWindow.activePage = doc.pages[0];
            }
        } catch (e) {}

        bringLayerToFront(doc, config.layers.coverGraphics);
        bringLayerToFront(doc, config.layers.coverText);
    }

    function registerAnnumAutoPdfOnSave(doc, pdfOutput, orderFolder, config) {
        doc.insertLabel("AnnumV26AutoPdfEnabled", "1");
        doc.insertLabel("AnnumV26AutoPdfPath", pdfOutput.fsName);
        doc.insertLabel("AnnumV26AutoPdfPreset", config.pdfPresetName);
        doc.insertLabel(
            "AnnumV26AutoPdfLogPath",
            orderFolder.fsName + "/automation-log.txt"
        );
    }

    function disableAnnumAutoPdfOnSave(doc) {
        try {
            doc.insertLabel("AnnumV26AutoPdfEnabled", "0");
        } catch (e) {}
    }

    function showPhotoReviewPalette(
        doc,
        inddOutput,
        pdfOutput,
        config,
        log,
        orderFolder
    ) {
        var palette = new Window("palette", stripDiacritics("Annum — uprava fotiek"));
        palette.orientation = "column";
        palette.alignChildren = ["fill", "top"];
        palette.preferredSize = [380, 150];
        palette.spacing = 8;
        palette.margins = 12;

        palette.add(
            "statictext",
            undefined,
            stripDiacritics(
                "Uprav fotky: Direct Selection (A).\n" +
                    "Cmd+S / Ulozit = automaticky exportuje PDF.\n" +
                    "Alebo klikni tlacidlo Ulozit."
            ),
            { multiline: true }
        );

        var buttonRow = palette.add("group");
        buttonRow.orientation = "row";
        buttonRow.alignChildren = ["fill", "center"];
        buttonRow.spacing = 8;

        var saveButton = buttonRow.add(
            "button",
            undefined,
            stripDiacritics("Ulozit")
        );
        var closeButton = buttonRow.add(
            "button",
            undefined,
            stripDiacritics("Zavriet")
        );

        saveButton.onClick = function () {
            try {
                if (!doc || !doc.isValid) {
                    throw new Error("Kalendar uz nie je otvoreny.");
                }

                app.activeDocument = doc;
                if (!$.global.annumAutoPdfResults) {
                    $.global.annumAutoPdfResults = {};
                }
                $.global.annumAutoPdfResults[String(doc.id)] = {
                    status: "pending",
                    error: ""
                };
                doc.save();

                var exportResult =
                    $.global.annumAutoPdfResults[String(doc.id)] || {};
                var exportedPdf = File(pdfOutput.fsName);
                if (exportResult.status !== "success" || !exportedPdf.exists) {
                    throw new Error(
                        exportResult.error || "PDF export sa nepotvrdil."
                    );
                }

                alertAscii(
                    "Ulozene.\n\nPDF exportovane:\n" + pdfOutput.fsName
                );
            } catch (saveError) {
                alertAscii("Ulozenie zlyhalo:\n" + formatScriptError(saveError));
            }
        };

        var paletteClosing = false;

        function closePaletteAndDisableExport() {
            if (paletteClosing) return;
            paletteClosing = true;
            disableAnnumAutoPdfOnSave(doc);
            try {
                if (doc && doc.isValid) {
                    doc.save();
                }
            } catch (e) {
                alertAscii(
                    "Nepodarilo sa ulozit vypnutie automatickeho PDF exportu:\n" +
                        formatScriptError(e)
                );
            }
        }

        closeButton.onClick = function () {
            closePaletteAndDisableExport();
            palette.close();
        };

        palette.onClose = function () {
            closePaletteAndDisableExport();
            return true;
        };

        palette.center();
        palette.show();
    }

    // -----------------------------
    // CORE HELPERS (continued)
    // -----------------------------

    function mmToPt(mm) {
        return UnitValue(Number(mm) + "mm").as("pt");
    }

    function readJson(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) {
            throw new Error("order.json sa nepodarilo otvorit na citanie.");
        }
        var content = file.read();
        file.close();

        var parsed;
        try {
            parsed = parseJson(content);
        } catch (parseError) {
            throw new Error(
                "order.json nie je platny JSON: " +
                    formatScriptError(parseError)
            );
        }

        var sanitized;
        try {
            sanitized = sanitizeOrderNulls(parsed, null);
        } catch (sanitizeError) {
            throw new Error(
                "Nepodarilo sa vycistit data z order.json: " +
                    formatScriptError(sanitizeError)
            );
        }

        try {
            return normalizeOrder(sanitized);
        } catch (normalizeError) {
            throw new Error(
                "Nepodarilo sa normalizovat order.json: " +
                    formatScriptError(normalizeError)
            );
        }
    }

    function runStep(label, fn) {
        try {
            return fn();
        } catch (stepError) {
            throw new Error(label + ": " + formatScriptError(stepError));
        }
    }

    function parseJson(content) {
        var source = String(content || "");
        if (source.length > 0 && source.charCodeAt(0) === 0xfeff) {
            source = source.substring(1);
        }
        var index = 0;

        function fail(message) {
            throw new Error(message + " (pozicia " + index + ")");
        }

        function skipWhitespace() {
            while (index < source.length && /\s/.test(source.charAt(index))) {
                index++;
            }
        }

        function parseString() {
            var result = "";
            if (source.charAt(index) !== '"') fail("Ocakavany JSON retazec");
            index++;

            while (index < source.length) {
                var ch = source.charAt(index++);
                if (ch === '"') return result;
                if (ch === "\\") {
                    if (index >= source.length) fail("Neukonceny escape");
                    var escaped = source.charAt(index++);
                    if (escaped === '"') {
                        result += '"';
                    } else if (escaped === "\\") {
                        result += "\\";
                    } else if (escaped === "/") {
                        result += "/";
                    } else if (escaped === "b") {
                        result += "\b";
                    } else if (escaped === "f") {
                        result += "\f";
                    } else if (escaped === "n") {
                        result += "\n";
                    } else if (escaped === "r") {
                        result += "\r";
                    } else if (escaped === "t") {
                        result += "\t";
                    } else if (escaped === "u") {
                        var hex = source.substr(index, 4);
                        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
                            fail("Neplatny Unicode escape");
                        }
                        result += String.fromCharCode(parseInt(hex, 16));
                        index += 4;
                    } else {
                        fail("Neplatny escape");
                    }
                } else {
                    if (ch.charCodeAt(0) < 32) fail("Riadiaci znak v retazci");
                    result += ch;
                }
            }

            fail("Neukonceny JSON retazec");
        }

        function parseNumber() {
            var remainder = source.substring(index);
            var match = remainder.match(
                /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/
            );
            if (!match) fail("Neplatne JSON cislo");
            index += match[0].length;
            return Number(match[0]);
        }

        function parseArray() {
            var result = [];
            index++;
            skipWhitespace();
            if (source.charAt(index) === "]") {
                index++;
                return result;
            }

            while (index < source.length) {
                result.push(parseValue());
                skipWhitespace();
                var ch = source.charAt(index++);
                if (ch === "]") return result;
                if (ch !== ",") fail("Ocakavana ciarka v poli");
                skipWhitespace();
            }

            fail("Neukoncene JSON pole");
        }

        function parseObject() {
            var result = {};
            index++;
            skipWhitespace();
            if (source.charAt(index) === "}") {
                index++;
                return result;
            }

            while (index < source.length) {
                if (source.charAt(index) !== '"') {
                    fail("Ocakavany kluc objektu");
                }
                var key = parseString();
                skipWhitespace();
                if (source.charAt(index++) !== ":") {
                    fail("Ocakavana dvojbodka");
                }
                skipWhitespace();
                result[key] = parseValue();
                skipWhitespace();
                var ch = source.charAt(index++);
                if (ch === "}") return result;
                if (ch !== ",") fail("Ocakavana ciarka v objekte");
                skipWhitespace();
            }

            fail("Neukonceny JSON objekt");
        }

        function parseValue() {
            skipWhitespace();
            var ch = source.charAt(index);

            if (ch === '"') return parseString();
            if (ch === "{") return parseObject();
            if (ch === "[") return parseArray();
            if (ch === "-" || /[0-9]/.test(ch)) return parseNumber();
            if (source.substr(index, 4) === "true") {
                index += 4;
                return true;
            }
            if (source.substr(index, 5) === "false") {
                index += 5;
                return false;
            }
            if (source.substr(index, 4) === "null") {
                index += 4;
                return null;
            }

            fail("Neplatna JSON hodnota");
        }

        var parsed = parseValue();
        skipWhitespace();
        if (index !== source.length) fail("Data za koncom JSON");
        return parsed;
    }

    function formatScriptError(error) {
        if (!error) {
            return "Neznama chyba.";
        }

        var message = "";

        if (typeof error === "string") {
            message = error;
        } else {
            try {
                if (error.message) {
                    message = String(error.message);
                }
            } catch (ignored) {}

            if (!message) {
                try {
                    if (error.toString) {
                        message = String(error.toString());
                    }
                } catch (ignored2) {}
            }
        }

        if (!message) {
            return String(error);
        }

        if (
            message.indexOf("expected string, received null") !== -1 ||
            message.indexOf("Expected String, but received nothing") !== -1
        ) {
            return (
                "order.json obsahuje prazdne textove polia (null). " +
                "Stiahnite objednavku znova z adminu a spustite script verzie " +
                SCRIPT_VERSION +
                "."
            );
        }

        try {
            if (error.line) {
                message += " (riadok scriptu " + error.line + ")";
            }
        } catch (ignored3) {}

        return message;
    }

    function isNumericOrderKey(key) {
        return (
            key === "width" ||
            key === "height" ||
            key === "size" ||
            key === "index" ||
            key === "day" ||
            key === "month" ||
            key === "quantity" ||
            key === "totalPrice" ||
            key === "discountAmount" ||
            key === "price" ||
            key === "originalSize"
        );
    }

    function sanitizeOrderNulls(value, key) {
        if (value === null || value === undefined) {
            if (key && isNumericOrderKey(key)) {
                return 0;
            }

            return "";
        }

        if (typeof value === "object" && value instanceof Array) {
            var sanitizedArray = [];

            for (var i = 0; i < value.length; i++) {
                sanitizedArray.push(sanitizeOrderNulls(value[i], key));
            }

            return sanitizedArray;
        }

        if (typeof value === "object") {
            var sanitizedObject = {};

            for (var objectKey in value) {
                sanitizedObject[objectKey] = sanitizeOrderNulls(
                    value[objectKey],
                    objectKey
                );
            }

            return sanitizedObject;
        }

        return value;
    }

    function stringOrEmpty(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value);
    }

    function normalizeDedications(raw) {
        var result = [];

        if (!raw || !raw.length) {
            return result;
        }

        for (var i = 0; i < raw.length; i++) {
            result.push(trim(stringOrEmpty(raw[i])));
        }

        return result;
    }

    function normalizeOrder(order) {
        if (!order) {
            return order;
        }

        order.orderCode = trim(stringOrEmpty(order.orderCode)) || trim(stringOrEmpty(order.id));

        var rawDedications = order.dedications;

        if ((!rawDedications || !rawDedications.length) && order.dedication) {
            rawDedications = [order.dedication];
        }

        if (
            (!rawDedications || !rawDedications.length) &&
            order.calendar &&
            order.calendar.dedications
        ) {
            rawDedications = order.calendar.dedications;
        }

        order.dedications = normalizeDedications(rawDedications);

        if (order.calendar) {
            order.calendar.note = stringOrEmpty(order.calendar.note);
            order.calendar.discountCode = stringOrEmpty(order.calendar.discountCode);
        }

        if (order.customer) {
            order.customer.firstName = stringOrEmpty(order.customer.firstName);
            order.customer.lastName = stringOrEmpty(order.customer.lastName);
            order.customer.email = stringOrEmpty(order.customer.email);
            order.customer.phone = stringOrEmpty(order.customer.phone);
        }

        if (order.birthdays && order.birthdays.length) {
            var normalizedBirthdays = [];

            for (var b = 0; b < order.birthdays.length; b++) {
                var birthday = order.birthdays[b];
                if (!birthday) continue;

                normalizedBirthdays.push({
                    day: birthday.day,
                    month: birthday.month,
                    name: stringOrEmpty(birthday.name)
                });
            }

            order.birthdays = normalizedBirthdays;
        }

        if (order.namedays && order.namedays.length) {
            var normalizedNamedays = [];

            for (var n = 0; n < order.namedays.length; n++) {
                var nameday = order.namedays[n];
                if (!nameday) continue;

                normalizedNamedays.push({
                    name: stringOrEmpty(nameday.name)
                });
            }

            order.namedays = normalizedNamedays;
        }

        if (order.photos && order.photos.length) {
            for (var p = 0; p < order.photos.length; p++) {
                var photo = order.photos[p];
                if (!photo) continue;

                photo.fileName = stringOrEmpty(photo.fileName);
                photo.localPath = stringOrEmpty(photo.localPath);
                photo.name = stringOrEmpty(photo.name);
                photo.orientation = stringOrEmpty(photo.orientation);
            }
        }

        return order;
    }

    function validateOrder(order) {
        if (!order) throw new Error("order.json je prazdny alebo neplatny.");
        if (!order.orderCode) throw new Error("order.json neobsahuje orderCode.");
        if (!order.photos || order.photos.length === 0) {
            throw new Error("order.json neobsahuje ziadne fotky.");
        }

        for (var i = 0; i < (order.birthdays || []).length; i++) {
            var birthday = order.birthdays[i];
            var day = Number(birthday && birthday.day);
            var month = Number(birthday && birthday.month);
            var birthdayName = trim(
                stringOrEmpty(birthday && (birthday.name || birthday.fullName))
            );

            if (!isValidCalendarDate(day, month, CONFIG.calendarYear)) {
                throw new Error(
                    "Neplatny datum narodenin v order.json: " +
                        day +
                        "." +
                        month +
                        "."
                );
            }

            if (!birthdayName) {
                throw new Error(
                    "Narodeniny " +
                        day +
                        "." +
                        month +
                        ". nemaju vyplnene meno."
                );
            }
        }
    }

    function isValidCalendarDate(day, month, year) {
        if (!day || !month || month < 1 || month > 12 || day < 1) {
            return false;
        }

        var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var numericYear = Number(year || 0);
        if (
            numericYear &&
            numericYear % 4 === 0 &&
            (numericYear % 100 !== 0 || numericYear % 400 === 0)
        ) {
            days[1] = 29;
        }

        return day <= days[month - 1];
    }

    function describeResolvedFile(label, file, pickedManually) {
        if (!file) {
            return label + ": (nevybraty)";
        }

        var line = label + ": " + file.fsName;

        if (pickedManually) {
            line += " [rucny vyber]";
        }

        try {
            if (file.modified) {
                line += " | upravene: " + file.modified;
            }
        } catch (e) {}

        return line;
    }

    function resolveFile(path, dialogTitle, filter, options) {
        options = options || {};
        var file = File(path);

        if (!options.forceDialog && file.exists) {
            if (options.log && options.label) {
                options.log.push(describeResolvedFile(options.label, file, false));
            }

            return file;
        }

        var picked = File.openDialog(dialogTitle, filter || "*.*");

        if (!picked) {
            return null;
        }

        if (options.log && options.label) {
            options.log.push(describeResolvedFile(options.label, picked, true));
        }

        return picked;
    }

    function openSourceDocument(file, reloadFromDisk) {
        if (!file || !file.exists) {
            throw new Error("Subor neexistuje: " + (file ? file.fsName : "(prazdny)"));
        }

        if (reloadFromDisk) {
            for (var i = app.documents.length - 1; i >= 0; i--) {
                var openDoc = app.documents[i];

                try {
                    if (
                        openDoc.fullName &&
                        openDoc.fullName.fsName === file.fsName
                    ) {
                        if (openDoc.modified) {
                            throw new Error(
                                "Subor ma neulozene zmeny. Najprv ho uloz alebo zatvor: " +
                                    file.fsName
                            );
                        }
                        openDoc.close(SaveOptions.NO);
                    }
                } catch (e) {
                    if (
                        e &&
                        e.message &&
                        String(e.message).indexOf("neulozene zmeny") !== -1
                    ) {
                        throw e;
                    }
                }
            }
        }

        return app.open(file);
    }

    function ensureDocumentWindow(doc) {
        try {
            if (!doc || !doc.isValid) {
                return false;
            }

            for (var i = 0; i < doc.windows.length; i++) {
                try {
                    if (doc.windows[i].isValid) {
                        app.activeWindow = doc.windows[i];
                        return true;
                    }
                } catch (e) {}
            }

            doc.windows.add();

            if (doc.windows.length > 0) {
                app.activeWindow = doc.windows[0];
                return true;
            }
        } catch (e) {}

        return false;
    }

    function formatLogLinesForAlert(lines, maxLines) {
        var picked = [];
        var limit = Math.min(lines.length, maxLines || lines.length);

        for (var i = 0; i < limit; i++) {
            picked.push(lines[i]);
        }

        return picked.join("\n");
    }

    function safeFileName(value) {
        return String(value)
            .replace(/[\\\/\:\*\?\"\<\>\|]/g, "-")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase();
    }

    function buildOrderOutputBaseName(order, config) {
        var parts = [];

        if (order.customer) {
            var lastName = safeFileName(order.customer.lastName);
            var firstName = safeFileName(order.customer.firstName);

            if (lastName) {
                parts.push(lastName);
            }

            if (firstName) {
                parts.push(firstName);
            }
        }

        if (config.calendarYear) {
            parts.push(String(config.calendarYear));
        }

        var code = safeFileName(order.orderCode || "");
        if (code) {
            parts.push(code);
        }

        if (parts.length > 0) {
            return parts.join("-");
        }

        return "calendar";
    }

    function buildOrderOutputPaths(order, orderFolder, config) {
        var baseName = buildOrderOutputBaseName(order, config);
        var availableBaseName = baseName;
        var suffix = 2;

        while (
            File(orderFolder.fsName + "/" + availableBaseName + ".indd").exists ||
            File(orderFolder.fsName + "/" + availableBaseName + ".pdf").exists
        ) {
            availableBaseName = baseName + "-" + suffix;
            suffix++;
        }

        return {
            baseName: availableBaseName,
            indd: File(orderFolder.fsName + "/" + availableBaseName + ".indd"),
            pdf: File(orderFolder.fsName + "/" + availableBaseName + ".pdf")
        };
    }

    function saveCalendarToOrderFile(calendarDoc, inddOutput) {
        calendarDoc.save(inddOutput);
    }

    function ensureLayer(doc, name) {
        name = stringOrEmpty(name) || "Layer";
        var layer;

        try {
            layer = doc.layers.itemByName(name);
            layer.name;
        } catch (e) {
            layer = doc.layers.add({ name: name });
        }

        layer.locked = false;
        layer.visible = true;

        return layer;
    }

    function ensureColor(doc, name, rgb) {
        name = stringOrEmpty(name) || "Color";
        var color;

        try {
            color = doc.colors.itemByName(name);
            color.name;
        } catch (e) {
            color = doc.colors.add({
                name: name,
                model: ColorModel.process,
                space: ColorSpace.RGB,
                colorValue: rgb
            });
        }

        return color;
    }

    function labelCalendarPages(doc) {
        if (doc.pages.length !== 13) {
            throw new Error(
                "Dokument musi mat presne 13 stran: cover + 12 mesiacov. Aktualne: " +
                    doc.pages.length +
                    "."
            );
        }

        doc.pages[0].label = "cover";

        for (var i = 0; i < 12; i++) {
            doc.pages[i + 1].label = "month-" + (i + 1);
        }
    }

    function exportPdf(doc, outputFile, presetName) {
        if (!doc || !doc.isValid) {
            throw new Error("Dokument na PDF export nie je platny.");
        }

        if (!outputFile) {
            throw new Error("Chybna cesta vystupneho PDF.");
        }

        var preset = null;
        var resolvedPresetName = stringOrEmpty(presetName) || "[High Quality Print]";

        try {
            preset = app.pdfExportPresets.itemByName(resolvedPresetName);
            preset.name;
        } catch (e) {
            try {
                preset = app.pdfExportPresets.itemByName("[Press Quality]");
                preset.name;
            } catch (_) {
                preset = app.pdfExportPresets[0];
            }
        }

        if (!preset) {
            throw new Error("Nenasiel som PDF export preset.");
        }

        doc.exportFile(ExportFormat.PDF_TYPE, outputFile, false, preset);
    }

    function prepareDocumentForPdfExport(doc) {
        sanitizeDocumentMetadata(doc);
        sanitizeAllDocumentText(doc);
    }

    function sanitizeAllDocumentText(doc) {
        sanitizeStoryContents(doc);

        try {
            for (var p = 0; p < doc.pages.length; p++) {
                var page = doc.pages[p];

                try {
                    if (page.label === null || page.label === undefined) {
                        page.label = "";
                    }
                } catch (e) {}

                try {
                    var frames = page.textFrames;

                    for (var f = 0; f < frames.length; f++) {
                        try {
                            if (
                                frames[f].contents === null ||
                                frames[f].contents === undefined
                            ) {
                                frames[f].contents = "";
                            }
                        } catch (e) {}
                    }
                } catch (e) {}

                try {
                    var label = stringOrEmpty(page.label);
                    if (label !== page.label) {
                        page.label = label;
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    function sanitizeDocumentMetadata(doc) {
        try {
            var meta = doc.metadataPreferences;
            var keys = [
                "documentTitle",
                "author",
                "description",
                "keywords",
                "copyrightNotice",
                "authorTitle",
                "jobTitle",
                "copyrightStatus"
            ];

            for (var i = 0; i < keys.length; i++) {
                try {
                    var key = keys[i];
                    var value = meta[key];

                    if (value === null || value === undefined) {
                        meta[key] = " ";
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    function sanitizeStoryContents(doc) {
        try {
            for (var i = 0; i < doc.stories.length; i++) {
                try {
                    var story = doc.stories[i];
                    var contents = story.contents;

                    if (contents === null || contents === undefined) {
                        story.contents = "";
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }

    function clearLayerItems(doc, layerName) {
        try {
            var layer = doc.layers.itemByName(layerName);
            layer.name;

            layer.locked = false;
            layer.visible = true;

            var items = layer.pageItems;

            for (var i = items.length - 1; i >= 0; i--) {
                try {
                    items[i].remove();
                } catch (e) {}
            }
        } catch (e) {}
    }

    function writeRunLog(folder, lines, errors) {
        try {
            var file = File(folder.fsName + "/automation-log.txt");
            file.encoding = "UTF-8";
            file.open("w");
            file.writeln("Annum automation log");
            file.writeln("====================");
            file.writeln("");
            file.writeln("Created: " + new Date());
            file.writeln("");

            for (var i = 0; i < lines.length; i++) {
                file.writeln("- " + lines[i]);
            }

            if (errors && errors.length > 0) {
                file.writeln("");
                file.writeln("Errors");
                file.writeln("------");
                for (var e = 0; e < errors.length; e++) {
                    file.writeln("- " + errors[e]);
                }
            }

            file.close();
        } catch (_) {}
    }

    // -----------------------------
    // PHOTO LAYOUT AUTOMATION
    // -----------------------------

    function fillPhotos(calendarDoc, coverLayoutsDoc, layoutsDoc, order, photosFolder, config) {
        var files = getPhotoFilesFromOrder(order, photosFolder);

        if (files.length === 0) {
            throw new Error("Nenasiel som ziadne fotky v photos/ podla order.json.");
        }

        clearCalendarPhotoFrames(calendarDoc, config);

        var images = [];

        for (var i = 0; i < files.length; i++) {
            images.push({
                file: files[i].file,
                width: files[i].width,
                height: files[i].height,
                aspectRatio: files[i].aspectRatio,
                orientation: files[i].orientation
            });
        }

        shuffleArray(images);

        // Cover pouziva kopiu poolu; rovnake fotky tak zostanu dostupne aj pre mesiace.
        var coverImages = images.slice(0);
        var coverResult = fillCoverPhotos(
            calendarDoc,
            coverLayoutsDoc,
            coverImages,
            config
        );
        var monthResult = fillMonthPhotos(calendarDoc, layoutsDoc, images, config);

        return {
            coverUsed: coverResult.used,
            coverLayoutFrameCount: coverResult.layoutFrameCount,
            coverLayoutPageIndex: coverResult.layoutPageIndex,
            coverDecorationsCopied: coverResult.decorationsCopied,
            coverDecorationLog: coverResult.decorationLog,
            monthUsed: monthResult.used,
            monthLayoutSource: monthResult.layoutSource,
            unused: images.length,
            coverLayoutsCount: coverResult.layoutsCount,
            monthLayoutsCount: monthResult.layoutsCount
        };
    }

    function fillCoverPhotos(calendarDoc, coverLayoutsDoc, images, config) {
        var coverLayouts = readLayouts(coverLayoutsDoc, {
            minFrameWidthMm: config.cover.minFrameWidthMm,
            minFrameHeightMm: config.cover.minFrameHeightMm,
            photoLayerName: config.layers.photos
        });

        if (coverLayouts.length === 0) {
            throw new Error(
                "V cover-layouts.indd som nenasiel cover layouty s foto slotmi na vrstve " +
                    config.layers.photos +
                    "."
            );
        }

        var coverPage = calendarDoc.pages[0];
        var targetLayer = ensureLayer(calendarDoc, config.layers.photos);
        calendarDoc.activeLayer = targetLayer;

        var coverPhotoCount = Math.min(config.cover.photoCount, images.length);
        var layout = findLayout(coverLayouts, coverPhotoCount, images);

        if (!layout) {
            throw new Error(
                "Nenasiel som vhodny cover layout pre " + coverPhotoCount + " fotiek."
            );
        }

        var frameLimit = Math.min(layout.frames.length, coverPhotoCount, images.length);
        var frameOrder = buildFrameAssignmentOrder(layout.frames, frameLimit);
        var used = 0;

        var previousCoverGraphics = getCoverGraphicsForPage(
            calendarDoc,
            coverPage,
            config.layers.coverGraphics
        );
        removePageItems(previousCoverGraphics);

        for (var f = 0; f < frameOrder.length; f++) {
            var frameIndex = frameOrder[f].index;
            var frameData = layout.frames[frameIndex];
            var bestIndex = pickBestImageIndex(images, frameData);

            if (bestIndex === -1) {
                bestIndex = 0;
            }

            var imageData = images[bestIndex];

            var targetBounds = applyRelativeBoundsToPage(frameData.relativeBounds, coverPage);

            var frame = createTargetFrame(
                coverPage,
                targetBounds,
                targetLayer
            );

            frame.place(imageData.file);
            frame.fit(FitOptions.FILL_PROPORTIONALLY);
            frame.fit(FitOptions.CENTER_CONTENT);
            takeImage(images, bestIndex);

            used++;
        }

        var decorationResult = copyCoverGraphicsLayer(
            coverLayoutsDoc,
            layout.page,
            calendarDoc,
            coverPage,
            config
        );

        return {
            used: used,
            layoutsCount: coverLayouts.length,
            layoutFrameCount: layout.count,
            layoutPageIndex: layout.pageIndex,
            decorationsCopied: decorationResult.copied,
            decorationLog: decorationResult.log
        };
    }

    function getCoverGraphicsForPage(doc, page, layerName) {
        var items = [];

        try {
            var layer = doc.layers.itemByName(layerName);
            layer.name;

            for (var i = 0; i < layer.pageItems.length; i++) {
                try {
                    if (layer.pageItems[i].parentPage === page) {
                        items.push(layer.pageItems[i]);
                    }
                } catch (e) {}
            }
        } catch (e) {}

        return items;
    }

    function removePageItems(items) {
        for (var i = items.length - 1; i >= 0; i--) {
            try {
                if (items[i] && items[i].isValid) {
                    items[i].remove();
                }
            } catch (e) {}
        }
    }

    function getTopLevelPageItems(page) {
        try {
            return page.pageItems;
        } catch (e) {
            return [];
        }
    }

    function getItemLayerName(item) {
        try {
            if (item.itemLayer && item.itemLayer.isValid) {
                return stringOrEmpty(item.itemLayer.name);
            }
        } catch (e) {}

        return "";
    }

    function isItemOnLayer(item, layerName) {
        if (!layerName) {
            return true;
        }

        return getItemLayerName(item) === layerName;
    }

    function getPageSizeLabel(page) {
        try {
            var heightMm = ((page.bounds[2] - page.bounds[0]) / 72) * 25.4;
            var widthMm = ((page.bounds[3] - page.bounds[1]) / 72) * 25.4;

            return (
                Math.round(widthMm) + "x" + Math.round(heightMm) + " mm"
            );
        } catch (e) {
            return "?";
        }
    }

    function getItemTypeName(item) {
        try {
            return item.constructor && item.constructor.name
                ? item.constructor.name
                : "Item";
        } catch (e) {
            return "Item";
        }
    }

    function getCoverPhotoFrameFilterOptions(config) {
        return {
            minFrameWidthMm: config.cover.minFrameWidthMm,
            minFrameHeightMm: config.cover.minFrameHeightMm,
            photoLayerName: config.layers.photos
        };
    }

    function isCoverLayoutPhotoSlot(item, boundsPage, config) {
        return isLayoutPhotoFrame(
            item,
            boundsPage,
            getCoverPhotoFrameFilterOptions(config)
        );
    }

    function activateDocumentPage(doc, page) {
        try {
            ensureDocumentWindow(doc);
            app.activeDocument = doc;
            var spread = page.parent;

            if (!spread || !spread.isValid) {
                return false;
            }

            if (app.activeWindow && app.activeWindow.parent === doc) {
                app.activeWindow.activeSpread = spread;
                return true;
            }

            for (var w = 0; w < app.windows.length; w++) {
                try {
                    if (app.windows[w].parent === doc) {
                        app.activeWindow = app.windows[w];
                        app.activeWindow.activeSpread = spread;
                        return true;
                    }
                } catch (e) {}
            }

            ensureDocumentWindow(doc);

            if (app.activeWindow && app.activeWindow.parent === doc) {
                app.activeWindow.activeSpread = spread;
                return true;
            }
        } catch (e) {}

        return false;
    }

    function walkContainerItems(container, visitor) {
        var items;

        try {
            items = container.pageItems;
        } catch (e) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!item || !item.isValid) {
                continue;
            }

            visitor(item);

            if (getItemTypeName(item) === "Group") {
                walkContainerItems(item, visitor);
            }
        }
    }

    function countCoverDecorationsOnPage(page, config) {
        var items = getTopLevelPageItems(page);
        var count = 0;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            if (!item || !item.isValid) {
                continue;
            }

            if (!isCoverDecorationLayer(item, config)) {
                continue;
            }

            if (isCoverLayoutPhotoSlot(item, page, config)) {
                continue;
            }

            count++;
        }

        return count;
    }

    function summarizeCoverItems(page, config) {
        var summary = {};
        var photoSlots = 0;

        walkContainerItems(page, function (item) {
            var layerName = getItemLayerName(item) || "(bez vrstvy)";
            var typeName = getItemTypeName(item);

            if (!summary[layerName]) {
                summary[layerName] = {};
            }

            summary[layerName][typeName] = (summary[layerName][typeName] || 0) + 1;

            if (isCoverLayoutPhotoSlot(item, page, config)) {
                photoSlots++;
            }
        });

        return {
            summary: summary,
            photoSlots: photoSlots,
            decorations: countCoverDecorationsOnPage(page, config)
        };
    }

    function buildCoverLayoutDiagnostics(layoutPage, calendarCoverPage, config) {
        var lines = [];
        var layoutStats = summarizeCoverItems(layoutPage, config);

        lines.push(
            "layout strana " +
                (layoutPage.documentOffset + 1) +
                ", velkost " +
                getPageSizeLabel(layoutPage) +
                ", foto sloty " +
                layoutStats.photoSlots +
                ", dekoracie " +
                layoutStats.decorations
        );

        lines.push(
            "cover template strana 1 velkost " + getPageSizeLabel(calendarCoverPage)
        );

        for (var layerName in layoutStats.summary) {
            if (!layoutStats.summary.hasOwnProperty(layerName)) {
                continue;
            }

            var typeParts = [];
            var typeCounts = layoutStats.summary[layerName];

            for (var typeName in typeCounts) {
                if (!typeCounts.hasOwnProperty(typeName)) {
                    continue;
                }

                typeParts.push(typeName + " " + typeCounts[typeName]);
            }

            lines.push("layout vrstva " + layerName + ": " + typeParts.join(", "));
        }

        try {
            var master = layoutPage.appliedMaster;

            if (master && master.isValid) {
                lines.push("layout master: " + stringOrEmpty(master.name));

                for (var mp = 0; mp < master.pages.length; mp++) {
                    var masterStats = summarizeCoverItems(master.pages[mp], config);
                    lines.push(
                        "master strana " +
                            (mp + 1) +
                            ", foto sloty " +
                            masterStats.photoSlots +
                            ", dekoracie " +
                            masterStats.decorations
                    );

                    for (var masterLayerName in masterStats.summary) {
                        if (!masterStats.summary.hasOwnProperty(masterLayerName)) {
                            continue;
                        }

                        var masterTypeParts = [];
                        var masterTypeCounts = masterStats.summary[masterLayerName];

                        for (var masterTypeName in masterTypeCounts) {
                            if (!masterTypeCounts.hasOwnProperty(masterTypeName)) {
                                continue;
                            }

                            masterTypeParts.push(
                                masterTypeName + " " + masterTypeCounts[masterTypeName]
                            );
                        }

                        lines.push(
                            "master vrstva " +
                                masterLayerName +
                                ": " +
                                masterTypeParts.join(", ")
                        );
                    }
                }
            } else {
                lines.push("layout master: (ziaden)");
            }
        } catch (e) {
            lines.push("layout master: (nepodarilo sa nacitat)");
        }

        return lines;
    }

    function isCoverDecorationLayer(item, config) {
        var layerName = getItemLayerName(item);
        var graphicsLayerName = stringOrEmpty(config.cover.graphicsLayerName);

        if (graphicsLayerName) {
            return layerName === graphicsLayerName;
        }

        return layerName !== "" && layerName !== config.layers.photos;
    }

    function unlockItemForEdit(item) {
        try {
            if (item.locked) {
                item.locked = false;
            }
        } catch (e) {}

        try {
            if (item.itemLayer && item.itemLayer.isValid) {
                item.itemLayer.locked = false;
                item.itemLayer.visible = true;
            }
        } catch (e) {}
    }

    function deselectDocument(doc) {
        try {
            doc.selection = NothingEnum.NOTHING;
        } catch (e) {}
    }

    function duplicatePageItemToCover(
        sourceItem,
        boundsPage,
        sourceDoc,
        targetPage,
        targetDoc,
        targetLayer,
        targetBounds
    ) {
        unlockItemForEdit(sourceItem);
        ensureDocumentWindow(sourceDoc);
        ensureDocumentWindow(targetDoc);

        app.activeDocument = sourceDoc;
        activateDocumentPage(sourceDoc, boundsPage);

        // InDesign 21+: duplicate(to) — Page, Spread, Layer, or [x,y]. Not LocationOptions.
        var duplicated = null;
        try {
            duplicated = sourceItem.duplicate(targetPage);

            duplicated.geometricBounds = targetBounds;
            duplicated.itemLayer = targetLayer;
            unlockItemForEdit(duplicated);
            return "";
        } catch (duplicateError) {
            removePageItems([duplicated]);
        }

        try {
            deselectDocument(sourceDoc);
            sourceItem.select(SelectionOptions.REPLACE);
            app.copy();
            deselectDocument(sourceDoc);

            app.activeDocument = targetDoc;
            activateDocumentPage(targetDoc, targetPage);
            app.paste();

            var pasted = targetDoc.selection;

            if (pasted && pasted.length > 0) {
                var pastedItem = pasted[0];
                try {
                    pastedItem.geometricBounds = targetBounds;
                    pastedItem.itemLayer = targetLayer;
                    unlockItemForEdit(pastedItem);
                } catch (pasteSetupError) {
                    removePageItems([pastedItem]);
                    throw pasteSetupError;
                }
                deselectDocument(targetDoc);
                return "";
            }
        } catch (pasteError) {}

        deselectDocument(sourceDoc);
        deselectDocument(targetDoc);
        return "duplicate";
    }

    function getGraphicsLayerItemsForPage(doc, page, layerName) {
        var items = [];

        try {
            var layer = doc.layers.itemByName(layerName);
            layer.name;
            layer.locked = false;
            layer.visible = true;

            for (var i = 0; i < layer.pageItems.length; i++) {
                var item = layer.pageItems[i];

                try {
                    if (!item || !item.isValid) {
                        continue;
                    }

                    if (item.parentPage !== page) {
                        continue;
                    }

                    items.push(item);
                } catch (e) {}
            }
        } catch (e) {}

        return items;
    }

    function copyCoverGraphicsLayer(
        coverLayoutsDoc,
        layoutPage,
        calendarDoc,
        coverPage,
        config
    ) {
        var log = buildCoverLayoutDiagnostics(layoutPage, coverPage, config);
        var sourceLayerName = config.cover.graphicsLayerName;
        var targetLayer = ensureLayer(calendarDoc, config.layers.coverGraphics);
        var directSources = getGraphicsLayerItemsForPage(
            coverLayoutsDoc,
            layoutPage,
            sourceLayerName
        );
        var sources = [];
        var copied = 0;

        for (var directIndex = 0; directIndex < directSources.length; directIndex++) {
            sources.push({
                item: directSources[directIndex],
                boundsPage: layoutPage
            });
        }

        if (sources.length === 0) {
            try {
                var appliedMaster = layoutPage.appliedMaster;
                if (appliedMaster && appliedMaster.isValid) {
                    for (var mp = 0; mp < appliedMaster.pages.length; mp++) {
                        var masterPage = appliedMaster.pages[mp];
                        var masterItems = getGraphicsLayerItemsForPage(
                            coverLayoutsDoc,
                            masterPage,
                            sourceLayerName
                        );

                        for (var mi = 0; mi < masterItems.length; mi++) {
                            sources.push({
                                item: masterItems[mi],
                                boundsPage: masterPage
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        log.push(
            "kopirujem vrstvu " +
                sourceLayerName +
                ", poloziek: " +
                sources.length
        );

        if (sources.length === 0) {
            log.push(
                "ziadne polozky na vrstve " +
                    sourceLayerName +
                    " pre layout stranu " +
                    (layoutPage.documentOffset + 1)
            );
        }

        ensureDocumentWindow(coverLayoutsDoc);
        ensureDocumentWindow(calendarDoc);

        for (var i = 0; i < sources.length; i++) {
            var sourceItem = sources[i].item;
            var boundsPage = sources[i].boundsPage;
            unlockItemForEdit(sourceItem);

            var relBounds = getBoundsRelativeToPage(sourceItem, boundsPage);
            var targetBounds = applyRelativeBoundsToPage(relBounds, coverPage);
            var copyError = duplicatePageItemToCover(
                sourceItem,
                boundsPage,
                coverLayoutsDoc,
                coverPage,
                calendarDoc,
                targetLayer,
                targetBounds
            );

            if (!copyError) {
                copied++;
            } else {
                log.push(
                    "kopirovanie zlyhalo (" +
                        copyError +
                        ", " +
                        getItemTypeName(sourceItem) +
                        ")"
                );
            }
        }

        log.push("dekoracii skopirovanych: " + copied);

        app.activeDocument = calendarDoc;

        return {
            copied: copied,
            log: log
        };
    }

    function readMonthLayouts(layoutsDoc, config) {
        var monthConfig = config.monthLayouts || {};
        var minFrameWidthMm =
            monthConfig.minFrameWidthMm !== undefined
                ? monthConfig.minFrameWidthMm
                : 25;
        var minFrameHeightMm =
            monthConfig.minFrameHeightMm !== undefined
                ? monthConfig.minFrameHeightMm
                : 25;
        var preferPhotoLayer = monthConfig.preferPhotoLayer !== false;
        var layouts = [];
        var usedPhotoLayer = false;
        var usedStrictFallback = false;
        var usedCompatibilityFallback = false;

        for (var p = 0; p < layoutsDoc.pages.length; p++) {
            var layoutPage = layoutsDoc.pages[p];
            var frames = [];

            if (preferPhotoLayer) {
                frames = collectLayoutPhotoFrames(layoutPage, layoutsDoc, {
                    photoLayerName: config.layers.photos,
                    minFrameWidthMm: minFrameWidthMm,
                    minFrameHeightMm: minFrameHeightMm
                });

                if (frames.length > 0) {
                    usedPhotoLayer = true;
                }
            }

            if (frames.length === 0) {
                frames = collectLayoutPhotoFrames(layoutPage, layoutsDoc, {
                    minFrameWidthMm: minFrameWidthMm,
                    minFrameHeightMm: minFrameHeightMm
                });

                if (frames.length > 0) {
                    usedStrictFallback = true;
                }
            }

            if (frames.length === 0) {
                frames = collectLayoutPhotoFrames(layoutPage, layoutsDoc, {
                    minFrameWidthMm: minFrameWidthMm,
                    minFrameHeightMm: minFrameHeightMm,
                    allowGenericPageItems: true
                });

                if (frames.length > 0) {
                    usedCompatibilityFallback = true;
                }
            }

            if (frames.length > 0) {
                sortFramesByPosition(frames);
                layouts.push({
                    page: layoutPage,
                    pageIndex: p,
                    frames: frames,
                    count: frames.length
                });
            }
        }

        return {
            layouts: layouts,
            layoutSource:
                usedCompatibilityFallback
                    ? "kompatibilny PageItem fallback"
                    : usedPhotoLayer && usedStrictFallback
                    ? "AUTO_PHOTOS + striktne strany layoutu"
                    : usedPhotoLayer
                      ? "vrstva " + config.layers.photos
                      : "striktne strany layoutu"
        };
    }

    function fillMonthPhotos(calendarDoc, layoutsDoc, images, config) {
        var MONTHS = 12;

        if (images.length === 0) {
            return {
                used: 0,
                layoutsCount: 0,
                layoutSource: "ziadne fotky"
            };
        }

        var monthLayoutRead = readMonthLayouts(layoutsDoc, config);
        var layouts = monthLayoutRead.layouts;
        var layoutSource = monthLayoutRead.layoutSource;

        if (layouts.length === 0) {
            throw new Error(
                "V layouts.indd som nenasiel ziadne mesacne layouty. " +
                    "Skontroluj foto sloty (vrstva AUTO_PHOTOS alebo bezne obdlzniky na strane layoutu)."
            );
        }

        var targetLayer = ensureLayer(calendarDoc, config.layers.photos);
        calendarDoc.activeLayer = targetLayer;

        var distribution = distribute(images.length, MONTHS);
        var used = 0;

        for (var month = 0; month < MONTHS; month++) {
            if (images.length === 0) break;

            var needed = distribution[month];
            if (needed <= 0) continue;

            var layout = findLayout(layouts, needed, images);

            if (!layout) {
                throw new Error(
                    "Nenasiel som vhodny mesacny layout pre " +
                        needed +
                        " fotiek (mesiac " +
                        (month + 1) +
                        "). Pridaj layout do layouts.indd."
                );
            }

            // page 0 je cover, mesiace začínajú na page 1
            var targetPage = calendarDoc.pages[month + 1];
            var frameLimit = Math.min(layout.frames.length, needed, images.length);
            var frameOrder = buildFrameAssignmentOrder(layout.frames, frameLimit);

            for (var f = 0; f < frameOrder.length; f++) {
                var frameIndex = frameOrder[f].index;
                var frameData = layout.frames[frameIndex];
                var bestIndex = pickBestImageIndex(images, frameData);

                if (bestIndex === -1) {
                    bestIndex = 0;
                }

                var imageData = images[bestIndex];

                var targetBounds = applyRelativeBoundsToPage(
                    frameData.relativeBounds,
                    targetPage
                );

                var frame = createTargetFrame(
                    targetPage,
                    targetBounds,
                    targetLayer
                );

                frame.place(imageData.file);
                frame.fit(FitOptions.FILL_PROPORTIONALLY);
                frame.fit(FitOptions.CENTER_CONTENT);
                takeImage(images, bestIndex);

                used++;
            }
        }

        return {
            used: used,
            layoutsCount: layouts.length,
            layoutSource: layoutSource
        };
    }

    function getPhotoFilesFromOrder(order, photosFolder) {
        var files = [];
        var missingCount = 0;

        for (var i = 0; i < order.photos.length; i++) {
            var photo = order.photos[i];
            var fileName = photo.fileName;

            if (!fileName && photo.localPath) {
                fileName = String(photo.localPath).replace(/^\.\/photos\//, "");
            }

            if (!fileName && photo.name) {
                fileName = String(i + 1) + "-" + photo.name;
            }

            if (!fileName) {
                missingCount++;
                continue;
            }

            var file = File(photosFolder.fsName + "/" + fileName);

            if (!file.exists && photo.name) {
                file = findFileByExactName(photosFolder, photo.name);
            }

            if (file && file.exists) {
                var aspectRatio = getAspectRatio(photo.width, photo.height);

                if (!aspectRatio) {
                    aspectRatio = readImageAspectRatio(file);
                }

                var orientation = getOrientationFromRatio(aspectRatio);

                if (orientation === "any" && photo.orientation) {
                    orientation = normalizeOrientationLabel(photo.orientation);
                }

                if (orientation === "any") {
                    orientation = normalizeOrientationLabel(
                        getImageOrientation(file)
                    );
                }

                files.push({
                    file: file,
                    width: Number(photo.width || 0),
                    height: Number(photo.height || 0),
                    aspectRatio: aspectRatio,
                    orientation: orientation
                });
            } else {
                missingCount++;
            }
        }

        if (missingCount > 0) {
            throw new Error(
                "V baliku objednavky chyba " +
                    missingCount +
                    " fotiek uvedenych v order.json. Vytvor novy export objednavky."
            );
        }

        return files;
    }

    function getAspectRatio(width, height) {
        width = Number(width || 0);
        height = Number(height || 0);

        if (!width || !height) {
            return 0;
        }

        return width / height;
    }

    function getBoundsAspectRatio(bounds) {
        if (!bounds) {
            return 0;
        }

        var h = bounds[2] - bounds[0];
        var w = bounds[3] - bounds[1];

        return getAspectRatio(w, h);
    }

    function getOrientationFromRatio(ratio) {
        if (!ratio) {
            return "any";
        }

        var thresholds = CONFIG.orientation;

        if (ratio >= thresholds.panoramicMin) {
            return "panoramic";
        }

        if (ratio >= thresholds.landscapeMin) {
            return "landscape";
        }

        if (ratio >= thresholds.squareMin) {
            return "square";
        }

        if (ratio >= thresholds.portraitMin) {
            return "portrait";
        }

        return "tall";
    }

    function normalizeOrientationLabel(label) {
        var normalized = String(label || "").toLowerCase();

        if (
            normalized === "portrait" ||
            normalized === "landscape" ||
            normalized === "square" ||
            normalized === "panoramic" ||
            normalized === "tall" ||
            normalized === "any"
        ) {
            return normalized;
        }

        return "any";
    }

    function getFillCropLoss(imageRatio, frameRatio) {
        if (!imageRatio || !frameRatio) {
            return 1;
        }

        var visibleFraction = Math.min(
            frameRatio / imageRatio,
            imageRatio / frameRatio
        );

        return 1 - visibleFraction;
    }

    function findFileByExactName(folder, suffix) {
        var files = folder.getFiles();
        var target = String(suffix).toLowerCase();

        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof File) {
                var name = files[i].name.toLowerCase();
                if (name === target) return files[i];
            }
        }

        return null;
    }

    function clearCalendarPhotoFrames(calendarDoc, config) {
        clearLayerItems(calendarDoc, config.layers.photos);
    }

    function getLayoutPageItems(page) {
        return getTopLevelPageItems(page);
    }

    function boundsKey(relativeBounds) {
        var tolerance = mmToPt(2);

        return (
            Math.round(relativeBounds[0] / tolerance) +
            "|" +
            Math.round(relativeBounds[1] / tolerance) +
            "|" +
            Math.round(relativeBounds[2] / tolerance) +
            "|" +
            Math.round(relativeBounds[3] / tolerance)
        );
    }

    function isUsableFrame(item) {
        try {
            if (!item || !item.isValid) return false;
            if (item.constructor && item.constructor.name === "TextFrame") return false;

            var gb = item.geometricBounds;
            var h = gb[2] - gb[0];
            var w = gb[3] - gb[1];

            return w > 1 && h > 1;
        } catch (e) {
            return false;
        }
    }

    function isFrameBoundsOnPage(relativeBounds, pageHeight, pageWidth, tolerancePt) {
        return (
            relativeBounds[0] >= -tolerancePt &&
            relativeBounds[1] >= -tolerancePt &&
            relativeBounds[2] <= pageHeight + tolerancePt &&
            relativeBounds[3] <= pageWidth + tolerancePt
        );
    }

    function hasExplicitPhotoFrameLabel(item) {
        var label = "";
        try {
            label = String(item.label || "").toLowerCase();
        } catch (e) {}

        return (
            label === "photo" ||
            label === "auto_photo" ||
            label === "portrait" ||
            label === "landscape" ||
            label === "square" ||
            label === "panoramic" ||
            label === "tall" ||
            label === "any"
        );
    }

    function isEmptyGraphicFrame(item) {
        try {
            return (
                item.contentType === ContentType.GRAPHIC_TYPE &&
                item.graphics.length === 0
            );
        } catch (e) {
            return false;
        }
    }

    function isLayoutPhotoFrame(item, page, frameFilterOptions) {
        frameFilterOptions = frameFilterOptions || {};
        var minWidthMm =
            frameFilterOptions.minFrameWidthMm !== undefined
                ? frameFilterOptions.minFrameWidthMm
                : 25;
        var minHeightMm =
            frameFilterOptions.minFrameHeightMm !== undefined
                ? frameFilterOptions.minFrameHeightMm
                : 25;
        var photoLayerName = frameFilterOptions.photoLayerName || "";

        if (photoLayerName && !isItemOnLayer(item, photoLayerName)) {
            return false;
        }

        if (!isUsableFrame(item)) {
            return false;
        }

        var typeName = getItemTypeName(item);

        if (typeName === "TextFrame" || typeName === "Group") {
            return false;
        }

        if (
            !photoLayerName &&
            !frameFilterOptions.allowGenericPageItems &&
            typeName !== "Rectangle" &&
            typeName !== "Oval" &&
            typeName !== "Polygon"
        ) {
            return false;
        }

        if (
            !photoLayerName &&
            !frameFilterOptions.allowGenericPageItems &&
            !hasExplicitPhotoFrameLabel(item) &&
            !isEmptyGraphicFrame(item)
        ) {
            return false;
        }

        var relativeBounds = getBoundsRelativeToPage(item, page);
        var pageHeight = page.bounds[2] - page.bounds[0];
        var pageWidth = page.bounds[3] - page.bounds[1];
        var tolerancePt = mmToPt(1);

        if (
            !isFrameBoundsOnPage(
                relativeBounds,
                pageHeight,
                pageWidth,
                tolerancePt
            )
        ) {
            return false;
        }

        var widthPt = relativeBounds[3] - relativeBounds[1];
        var heightPt = relativeBounds[2] - relativeBounds[0];

        var minWidthPt = mmToPt(minWidthMm);
        var minHeightPt = mmToPt(minHeightMm);

        return widthPt >= minWidthPt && heightPt >= minHeightPt;
    }

    function getBoundsRelativeToPage(item, page) {
        var gb = item.geometricBounds;
        var pb = page.bounds;

        return [gb[0] - pb[0], gb[1] - pb[1], gb[2] - pb[0], gb[3] - pb[1]];
    }

    function applyRelativeBoundsToPage(relativeBounds, page) {
        var pb = page.bounds;

        return [
            pb[0] + relativeBounds[0],
            pb[1] + relativeBounds[1],
            pb[0] + relativeBounds[2],
            pb[1] + relativeBounds[3]
        ];
    }

    function sortFramesByPosition(frames) {
        frames.sort(function (a, b) {
            var ab = a.relativeBounds;
            var bb = b.relativeBounds;
            var rowTolerance = mmToPt(8);

            if (Math.abs(ab[0] - bb[0]) > rowTolerance) {
                return ab[0] - bb[0];
            }

            return ab[1] - bb[1];
        });
    }

    function orientationMatchScore(frameLabel, imageOrientation) {
        if (frameLabel === "any" || imageOrientation === "any") {
            return 5;
        }

        if (frameLabel === imageOrientation) {
            return 20;
        }

        var compatible = {
            tall: { portrait: 8, square: 4 },
            portrait: { tall: 8, square: 6 },
            square: { portrait: 6, landscape: 6 },
            landscape: { square: 6, panoramic: 8 },
            panoramic: { landscape: 8 }
        };

        if (
            compatible[frameLabel] &&
            compatible[frameLabel][imageOrientation]
        ) {
            return compatible[frameLabel][imageOrientation];
        }

        return -20;
    }

    function scoreLayoutOrientationMatch(layout, neededCount, images) {
        var remaining = [];

        for (var copyIndex = 0; copyIndex < images.length; copyIndex++) {
            remaining.push(images[copyIndex]);
        }

        var frameLimit = Math.min(layout.frames.length, neededCount);
        var score = 0;
        var frameOrder = buildFrameAssignmentOrder(layout.frames, frameLimit);

        for (var f = 0; f < frameOrder.length; f++) {
            var frameOrderItem = frameOrder[f];
            var frameData = layout.frames[frameOrderItem.index];
            var bestIndex = pickBestImageIndex(remaining, frameData);

            if (bestIndex === -1 || remaining.length === 0) {
                score -= 50;
                continue;
            }

            var imageData = remaining[bestIndex];
            var frameRatio = getBoundsAspectRatio(frameData.relativeBounds);
            var imageRatio =
                imageData.aspectRatio ||
                getAspectRatio(imageData.width, imageData.height);
            var cropLoss = getFillCropLoss(imageRatio, frameRatio);

            score += orientationMatchScore(frameData.label, imageData.orientation);
            score += Math.max(0, 30 - cropLoss * 100);
            takeImage(remaining, bestIndex);
        }

        return score;
    }

    function layoutOrientationHistogramScore(layout, neededCount, images) {
        var counts = {
            tall: 0,
            portrait: 0,
            square: 0,
            landscape: 0,
            panoramic: 0,
            any: 0
        };

        for (var i = 0; i < images.length; i++) {
            var orientation = images[i].orientation || "any";
            counts[orientation] = (counts[orientation] || 0) + 1;
        }

        var profile = {
            tall: 0,
            portrait: 0,
            square: 0,
            landscape: 0,
            panoramic: 0,
            any: 0
        };
        var frameLimit = Math.min(layout.frames.length, neededCount);

        for (var f = 0; f < frameLimit; f++) {
            var label = layout.frames[f].label || "any";
            profile[label] = (profile[label] || 0) + 1;
        }

        return (
            Math.min(profile.tall, counts.tall) * 3 +
            Math.min(profile.portrait, counts.portrait) * 3 +
            Math.min(profile.square, counts.square) * 3 +
            Math.min(profile.landscape, counts.landscape) * 3 +
            Math.min(profile.panoramic, counts.panoramic) * 3 +
            Math.min(profile.any, counts.any)
        );
    }

    function buildFrameAssignmentOrder(frames, limit) {
        var ordered = [];

        for (var i = 0; i < limit; i++) {
            ordered.push({
                index: i,
                label: frames[i].label
            });
        }

        ordered.sort(function (a, b) {
            var rank = {
                tall: 0,
                portrait: 1,
                square: 2,
                landscape: 3,
                panoramic: 4,
                any: 5
            };
            var rankA = rank[a.label] !== undefined ? rank[a.label] : 5;
            var rankB = rank[b.label] !== undefined ? rank[b.label] : 5;

            if (rankA !== rankB) {
                return rankA - rankB;
            }

            return a.index - b.index;
        });

        return ordered;
    }

    function getLayoutCandidates(layouts, photoCount) {
        var exact = [];
        var smallestBiggerCount = null;
        var smallestBigger = [];

        for (var i = 0; i < layouts.length; i++) {
            var layout = layouts[i];

            if (layout.count === photoCount) {
                exact.push(layout);
            }

            if (layout.count > photoCount) {
                if (
                    smallestBiggerCount === null ||
                    layout.count < smallestBiggerCount
                ) {
                    smallestBiggerCount = layout.count;
                    smallestBigger = [layout];
                } else if (layout.count === smallestBiggerCount) {
                    smallestBigger.push(layout);
                }
            }
        }

        if (exact.length > 0) {
            return exact;
        }

        return smallestBigger;
    }

    function pickBestLayout(candidates, photoCount, images) {
        if (!candidates || candidates.length === 0) {
            return null;
        }

        if (candidates.length === 1) {
            return candidates[0];
        }

        var bestLayout = candidates[0];
        var bestScore = scoreLayoutOrientationMatch(bestLayout, photoCount, images);

        for (var i = 1; i < candidates.length; i++) {
            var candidate = candidates[i];
            var score = scoreLayoutOrientationMatch(candidate, photoCount, images);

            if (score > bestScore) {
                bestScore = score;
                bestLayout = candidate;
                continue;
            }

            if (score === bestScore) {
                var bestHistogram = layoutOrientationHistogramScore(
                    bestLayout,
                    photoCount,
                    images
                );
                var candidateHistogram = layoutOrientationHistogramScore(
                    candidate,
                    photoCount,
                    images
                );

                if (candidateHistogram > bestHistogram) {
                    bestLayout = candidate;
                }
            }
        }

        return bestLayout;
    }

    function getFrameOrientationFromBounds(bounds) {
        return getOrientationFromRatio(getBoundsAspectRatio(bounds));
    }

    function normalizeLabel(label, bounds) {
        var normalized = normalizeOrientationLabel(label);

        if (normalized !== "any") {
            return normalized;
        }

        return getFrameOrientationFromBounds(bounds);
    }

    function readImageAspectRatio(file) {
        var temp = app.documents.add(false);

        try {
            var placed = temp.pages[0].place(file);
            var item = placed && placed.length ? placed[0] : null;

            if (!item) {
                temp.close(SaveOptions.NO);
                return 0;
            }

            var gb = item.geometricBounds;
            var ratio = getAspectRatio(gb[3] - gb[1], gb[2] - gb[0]);

            temp.close(SaveOptions.NO);

            return ratio;
        } catch (e) {
            try {
                temp.close(SaveOptions.NO);
            } catch (_) {}

            return 0;
        }
    }

    function getImageOrientation(file) {
        return getOrientationFromRatio(readImageAspectRatio(file));
    }

    function distribute(total, months) {
        var result = [];
        var base = Math.floor(total / months);
        var extra = total % months;

        for (var i = 0; i < months; i++) {
            result.push(base + (i < extra ? 1 : 0));
        }

        shuffleArray(result);
        return result;
    }

    function shuffleArray(items) {
        for (var i = items.length - 1; i > 0; i--) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var current = items[i];
            items[i] = items[randomIndex];
            items[randomIndex] = current;
        }

        return items;
    }

    function getPhotoLayerItemsForPage(doc, page, layerName) {
        var items = [];

        try {
            var layer = doc.layers.itemByName(layerName);
            layer.name;
            layer.locked = false;
            layer.visible = true;

            for (var i = 0; i < layer.pageItems.length; i++) {
                var item = layer.pageItems[i];

                try {
                    if (!item || !item.isValid) {
                        continue;
                    }

                    if (item.parentPage !== page) {
                        continue;
                    }

                    items.push(item);
                } catch (e) {}
            }
        } catch (e) {}

        return items;
    }

    function collectLayoutPhotoFrames(layoutPage, layoutsDoc, frameFilterOptions) {
        var frames = [];
        var seenBounds = {};
        var photoLayerName = frameFilterOptions.photoLayerName || "";
        var items;

        if (photoLayerName) {
            items = getPhotoLayerItemsForPage(
                layoutsDoc,
                layoutPage,
                photoLayerName
            );
        } else {
            items = getLayoutPageItems(layoutPage);
        }

        function tryAddFrame(item, boundsPage) {
            if (!isLayoutPhotoFrame(item, boundsPage, frameFilterOptions)) {
                return;
            }

            var relBounds = getBoundsRelativeToPage(item, boundsPage);
            var key = boundsKey(relBounds);

            if (seenBounds[key]) {
                return;
            }

            seenBounds[key] = true;

            frames.push({
                original: item,
                relativeBounds: relBounds,
                label: normalizeLabel(item.label, item.geometricBounds)
            });
        }

        for (var j = 0; j < items.length; j++) {
            var item = items[j];

            if (getItemTypeName(item) === "Group") {
                walkContainerItems(item, function (child) {
                    tryAddFrame(child, layoutPage);
                });
                continue;
            }

            tryAddFrame(item, layoutPage);
        }

        return frames;
    }

    function readLayouts(layoutsDoc, frameFilterOptions) {
        var layouts = [];
        frameFilterOptions = frameFilterOptions || {};

        for (var p = 0; p < layoutsDoc.pages.length; p++) {
            var layoutPage = layoutsDoc.pages[p];
            var frames = collectLayoutPhotoFrames(
                layoutPage,
                layoutsDoc,
                frameFilterOptions
            );

            if (frames.length > 0) {
                sortFramesByPosition(frames);

                layouts.push({
                    page: layoutPage,
                    pageIndex: p,
                    frames: frames,
                    count: frames.length
                });
            }
        }

        return layouts;
    }

    function findLayout(layouts, photoCount, images) {
        return pickBestLayout(getLayoutCandidates(layouts, photoCount), photoCount, images);
    }

    function pickBestImageIndex(images, frameData) {
        if (!images || images.length === 0) {
            return -1;
        }

        if (!frameData) {
            return 0;
        }

        var frameRatio = getBoundsAspectRatio(frameData.relativeBounds);
        var bestIndex = 0;
        var bestScore = -Infinity;

        for (var i = 0; i < images.length; i++) {
            var imageData = images[i];
            var imageRatio =
                imageData.aspectRatio ||
                getAspectRatio(imageData.width, imageData.height);
            var cropLoss = getFillCropLoss(imageRatio, frameRatio);
            var score = orientationMatchScore(
                frameData.label,
                imageData.orientation
            );

            score += Math.max(0, 40 - cropLoss * 100);

            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    function takeImage(images, index) {
        var img = images[index];

        for (var i = index; i < images.length - 1; i++) {
            images[i] = images[i + 1];
        }

        images.length = images.length - 1;
        return img;
    }

    function createTargetFrame(targetPage, bounds, layer) {
        var frame = targetPage.rectangles.add(layer, {
            geometricBounds: bounds
        });

        // Foto frame-y sú len produkčné kontajnery pre fotky.
        // Nekopírujeme stroke/fill z layouts.indd, aby sa pracovné farebné bordery
        // nedostali do finálneho PDF.
        try {
            frame.strokeWeight = 0;
            frame.strokeColor = targetPage.parent.parent.swatches.itemByName("None");
            frame.fillColor = targetPage.parent.parent.swatches.itemByName("None");
        } catch (e) {
            try {
                frame.strokeWeight = 0;
            } catch (_) {}
        }

        return frame;
    }

    function bringLayerToFront(doc, layerName) {
        try {
            var layer = doc.layers.itemByName(layerName);
            layer.name;
            layer.locked = false;
            layer.visible = true;
            layer.move(LocationOptions.AT_BEGINNING);
        } catch (e) {}
    }

    // -----------------------------
    // NAMEDAY HIGHLIGHTS
    // -----------------------------

    function highlightNamedays(doc, namedays, config) {
        var targetNames = getNamedayNames(namedays);
        if (targetNames.length === 0) return { matches: 0, drawn: 0 };

        var layerName = config.layers.namedays;
        clearLayerItems(doc, layerName);

        var underlineHeight = mmToPt(config.namedays.underlineHeightMm);
        var underlineOffsetFromBaseline = mmToPt(config.namedays.underlineOffsetFromBaselineMm);
        var paddingLeft = mmToPt(config.namedays.paddingLeftMm);
        var paddingRight = mmToPt(config.namedays.paddingRightMm);

        var highlightLayer = ensureLayer(doc, layerName);
        var color = ensureColor(doc, config.namedays.colorName, config.namedays.colorValue);

        function getFoundNameBounds(found) {
            try {
                if (!found.characters || found.characters.length === 0) return null;

                var firstChar = found.characters[0];
                var lastChar = found.characters[found.characters.length - 1];

                return {
                    left: firstChar.horizontalOffset,
                    right: lastChar.endHorizontalOffset,
                    baseline: firstChar.baseline
                };
            } catch (e) {
                return null;
            }
        }

        function addUnderline(page, left, right, y) {
            var rect = page.rectangles.add(highlightLayer, {
                geometricBounds: [
                    y,
                    left - paddingLeft,
                    y + underlineHeight,
                    right + paddingRight
                ]
            });

            rect.fillColor = color;

            try {
                rect.transparencySettings.blendingSettings.opacity = 100;
            } catch (e) {}
            try {
                rect.bringToFront();
            } catch (e) {}
        }

        function isNameLetter(value) {
            if (!value) return false;

            return /^[A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž]$/.test(String(value));
        }

        function getStoryCharacter(story, index) {
            try {
                if (!story || index < 0 || index >= story.characters.length) return "";
                return String(story.characters[index].contents);
            } catch (e) {
                return "";
            }
        }

        function isExactNameMatch(found) {
            try {
                if (!found.characters || found.characters.length === 0) return false;

                var story = found.parentStory;
                var firstIndex = found.characters[0].index;
                var lastIndex = found.characters[found.characters.length - 1].index;

                var before = getStoryCharacter(story, firstIndex - 1);
                var after = getStoryCharacter(story, lastIndex + 1);

                if (isNameLetter(before)) return false;
                if (isNameLetter(after)) return false;

                return true;
            } catch (e) {
                return false;
            }
        }

        function escapeGrep(value) {
            return String(value).replace(/([\\^$.*+?()[\]{}|])/g, "\\$1");
        }

        function getExactNameGrep(name) {
            var letters = "A-Za-zÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽáäčďéíĺľňóôŕšťúýž";

            return "(?<![" + letters + "])" + escapeGrep(name) + "(?![" + letters + "])";
        }

        app.findTextPreferences = NothingEnum.nothing;
        app.changeTextPreferences = NothingEnum.nothing;

        var matches = [];
        var previousCaseSensitive = null;
        try {
            previousCaseSensitive = app.findChangeGrepOptions.caseSensitive;
        } catch (e) {}

        for (var n = 0; n < targetNames.length; n++) {
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;

            app.findGrepPreferences.findWhat = getExactNameGrep(targetNames[n]);

            try {
                app.findChangeGrepOptions.caseSensitive = true;
            } catch (e) {}

            var results = [];
            try {
                results = doc.findGrep();
            } catch (findError) {
                continue;
            }

            for (var i = 0; i < results.length; i++) {
                var found = results[i];

                try {
                    if (!found.parentTextFrames || found.parentTextFrames.length === 0) continue;
                    if (!isExactNameMatch(found)) continue;

                    var textFrame = found.parentTextFrames[0];
                    var page = textFrame.parentPage;
                    if (!page) continue;
                    if (page.label === "cover") continue;

                    var bounds = getFoundNameBounds(found);
                    if (!bounds) continue;

                    matches.push({
                        page: page,
                        left: bounds.left,
                        right: bounds.right,
                        baseline: bounds.baseline,
                        name: targetNames[n]
                    });
                } catch (_) {}
            }
        }

        var drawnCount = 0;

        for (var m = 0; m < matches.length; m++) {
            var match = matches[m];
            // Use each match's own baseline so distance under the name stays consistent.
            var y = match.baseline + underlineOffsetFromBaseline;
            addUnderline(match.page, match.left, match.right, y);
            drawnCount++;
        }

        app.findTextPreferences = NothingEnum.nothing;
        app.changeTextPreferences = NothingEnum.nothing;
        app.findGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences = NothingEnum.nothing;
        try {
            if (previousCaseSensitive !== null) {
                app.findChangeGrepOptions.caseSensitive = previousCaseSensitive;
            }
        } catch (e) {}

        return { matches: matches.length, drawn: drawnCount };
    }

    function getNamedayNames(namedays) {
        var names = [];
        var seen = {};

        for (var i = 0; i < namedays.length; i++) {
            if (!namedays[i] || !namedays[i].name) continue;

            var name = trim(String(namedays[i].name));
            if (!name) continue;

            var key = name.toLowerCase();
            if (seen[key]) continue;

            seen[key] = true;
            names.push(name);
        }

        return names;
    }

    // -----------------------------
    // BIRTHDAYS
    // -----------------------------

    function insertBirthdays(doc, birthdaysFromOrder, giftIconFile, config) {
        var layerName = config.layers.birthdays;
        clearLayerItems(doc, layerName);

        var birthdays = normalizeBirthdays(birthdaysFromOrder);
        if (birthdays.length === 0) return { inserted: 0, failed: 0, errors: [] };
        if (!giftIconFile || !giftIconFile.exists) throw new Error("Chyba ikonka darceka.");

        var birthdayGroups = groupBirthdaysByDate(birthdays);

        var fontSize = config.birthdays.fontSize;
        var textWidth = mmToPt(config.birthdays.textWidthMm);
        var fontName = config.birthdays.fontName;
        var fontStyle = config.birthdays.fontStyle;
        var birthdayTextColorName = config.birthdays.colorName;
        var birthdayTextColorValue = config.birthdays.colorValue;
        var iconSize = mmToPt(config.birthdays.iconSizeMm);
        var iconGap = mmToPt(config.birthdays.iconGapMm);
        var offsetX = mmToPt(config.birthdays.offsetXMm);
        var offsetY = mmToPt(config.birthdays.offsetYMm);
        var minDayNumberX = mmToPt(config.birthdays.minDayNumberXMm);
        var minDayNumberPointSize = config.birthdays.minDayNumberPointSize || 14;
        var headerZoneRatio = config.birthdays.headerZoneRatio || 0.18;

        var birthdayLayer = ensureLayer(doc, layerName);
        var birthdayColor = ensureColor(doc, birthdayTextColorName, birthdayTextColorValue);

        function getPageForMonth(month) {
            var wantedLabel = "month-" + month;

            for (var i = 0; i < doc.pages.length; i++) {
                try {
                    if (doc.pages[i].label === wantedLabel) {
                        return doc.pages[i];
                    }
                } catch (e) {}
            }

            // Fallback if labels did not stick: page 0 = cover, page 1 = Jan, ...
            try {
                if (month >= 1 && month <= 12 && doc.pages.length > month) {
                    var fallbackPage = doc.pages[month];
                    try {
                        fallbackPage.label = wantedLabel;
                    } catch (e) {}
                    return fallbackPage;
                }
            } catch (e) {}

            return null;
        }

        function getPageId(page) {
            try {
                return page.documentOffset;
            } catch (e) {
                return -1;
            }
        }

        function getPageLabel(page) {
            try {
                return String(page.label || "");
            } catch (e) {
                return "";
            }
        }

        function isSamePage(a, b) {
            if (!a || !b) return false;

            try {
                if (a.documentOffset === b.documentOffset) return true;
            } catch (e) {}

            var labelA = getPageLabel(a);
            var labelB = getPageLabel(b);
            if (labelA && labelB && labelA === labelB) return true;

            try {
                return a === b;
            } catch (e) {}

            return false;
        }

        function getFoundPage(found) {
            try {
                if (
                    found.parentTextFrames &&
                    found.parentTextFrames.length > 0 &&
                    found.parentTextFrames[0].parentPage
                ) {
                    return found.parentTextFrames[0].parentPage;
                }
            } catch (e) {}
            return null;
        }

        function getTextBounds(textObj) {
            try {
                if (!textObj.characters || textObj.characters.length === 0) return null;

                var left = 999999;
                var right = -999999;
                var top = 999999;
                var bottom = -999999;
                var baseline = null;
                var pointSize = 0;

                for (var i = 0; i < textObj.characters.length; i++) {
                    var ch = textObj.characters[i];
                    var chLeft = ch.horizontalOffset;
                    var chRight = ch.endHorizontalOffset;
                    var chBaseline = ch.baseline;
                    var chSize = ch.pointSize;
                    var chTop = chBaseline - chSize;
                    var chBottom = chBaseline + chSize * 0.25;

                    if (chLeft < left) left = chLeft;
                    if (chRight > right) right = chRight;
                    if (chTop < top) top = chTop;
                    if (chBottom > bottom) bottom = chBottom;
                    if (baseline === null) baseline = chBaseline;
                    if (chSize > pointSize) pointSize = chSize;
                }

                if (left === 999999 || right === -999999) return null;

                return {
                    left: left,
                    right: right,
                    top: top,
                    bottom: bottom,
                    baseline: baseline,
                    pointSize: pointSize
                };
            } catch (e) {
                return null;
            }
        }

        function getFontStyleName(textObj) {
            try {
                var ch = textObj.characters[0];
                try {
                    return String(ch.appliedFont.fontStyleName || "");
                } catch (e) {}
                try {
                    return String(ch.fontStyle || "");
                } catch (e) {}
            } catch (e) {}
            return "";
        }

        /**
         * Current-month day numbers are Bold/Black; overflow days (prev/next month) are Regular/Light.
         */
        function getFontWeightScore(textObj) {
            var style = getFontStyleName(textObj).toLowerCase();
            var score = 0;

            if (!style) return 0;

            if (
                style.indexOf("black") !== -1 ||
                style.indexOf("heavy") !== -1 ||
                style.indexOf("extra bold") !== -1 ||
                style.indexOf("extrabold") !== -1
            ) {
                score += 800;
            } else if (
                style.indexOf("bold") !== -1 ||
                style.indexOf("demi") !== -1 ||
                style.indexOf("semi") !== -1
            ) {
                score += 600;
            } else if (
                style.indexOf("medium") !== -1 ||
                style.indexOf("book") !== -1
            ) {
                score += 200;
            } else if (
                style.indexOf("light") !== -1 ||
                style.indexOf("thin") !== -1 ||
                style.indexOf("hair") !== -1
            ) {
                score -= 600;
            } else if (
                style.indexOf("regular") !== -1 ||
                style.indexOf("roman") !== -1 ||
                style === "normal"
            ) {
                // Overflow days on this calendar use regular/light — deprioritize.
                score -= 400;
            }

            return score;
        }

        function isGrayishText(textObj) {
            try {
                var ch = textObj.characters[0];
                var fill = ch.fillColor;
                if (!fill) return false;

                try {
                    var swatchName = String(fill.name || "").toLowerCase();
                    if (
                        swatchName.indexOf("gray") !== -1 ||
                        swatchName.indexOf("grey") !== -1 ||
                        swatchName.indexOf("siv") !== -1
                    ) {
                        return true;
                    }
                    if (
                        swatchName === "black" ||
                        swatchName === "registration" ||
                        swatchName.indexOf("cern") !== -1 ||
                        swatchName.indexOf("black") !== -1
                    ) {
                        // Still check tint — muted Black tint is used for overflow days.
                    } else if (
                        swatchName.indexOf("red") !== -1 ||
                        swatchName.indexOf("cerv") !== -1
                    ) {
                        return false;
                    }
                } catch (e) {}

                // Muted overflow days are often Black with a low tint.
                try {
                    var tint = ch.fillTint;
                    if (tint !== -1 && tint > 0 && tint < 70) return true;
                } catch (e) {}

                var v = fill.colorValue;
                if (!v) return false;

                // RGB
                if (v.length === 3) {
                    var r = v[0];
                    var g = v[1];
                    var b = v[2];
                    var max = Math.max(r, g, b);
                    var min = Math.min(r, g, b);
                    if (min > 140) return true;
                    if (max - min < 30 && min > 90) return true;
                    return false;
                }

                // CMYK — light/gray overflow days
                if (v.length === 4) {
                    var c = v[0];
                    var m = v[1];
                    var y = v[2];
                    var k = v[3];

                    if (c < 10 && m < 10 && y < 10 && k > 0 && k < 60) return true;
                    if (c < 15 && m < 15 && y < 15 && k < 45) return true;
                    if (
                        Math.abs(c - m) < 6 &&
                        Math.abs(m - y) < 6 &&
                        c + m + y + k < 90 &&
                        k < 55
                    ) {
                        return true;
                    }
                    return false;
                }

                return false;
            } catch (e) {
                return false;
            }
        }

        function escapeGrep(value) {
            return String(value).replace(/([\\^$.*+?()[\]{}|])/g, "\\$1");
        }

        /** Avoid matching digits inside "2026" or other numbers (\\b2\\b hits the year). */
        function getExactDayGrep(day) {
            return "(?<![0-9])" + escapeGrep(String(day)) + "(?![0-9])";
        }

        function getPageHeaderBottom(page) {
            try {
                var pb = page.bounds;
                var pageHeight = pb[2] - pb[0];
                return pb[0] + pageHeight * headerZoneRatio;
            } catch (e) {
                return mmToPt(40);
            }
        }

        function isInHeaderZone(bounds, headerBottom) {
            return bounds.baseline < headerBottom || bounds.top < headerBottom;
        }

        function collectPageTextFrames(page) {
            var frames = [];
            var seen = {};

            function addFrame(frame) {
                try {
                    if (!frame || !frame.isValid) return;
                    if (!(frame instanceof TextFrame)) return;

                    try {
                        if (frame.itemLayer && frame.itemLayer.name === layerName) return;
                    } catch (e) {}

                    try {
                        if (frame.itemLayer && frame.itemLayer.name === config.layers.namedays) return;
                    } catch (e) {}

                    var key = String(frame.id);
                    if (seen[key]) return;
                    seen[key] = true;
                    frames.push(frame);
                } catch (e) {}
            }

            try {
                var direct = page.textFrames;
                for (var i = 0; i < direct.length; i++) {
                    addFrame(direct[i]);
                }
            } catch (e) {}

            try {
                var items = page.allPageItems;
                for (var j = 0; j < items.length; j++) {
                    addFrame(items[j]);
                }
            } catch (e) {}

            return frames;
        }

        /**
         * Find day number ONLY inside text frames on this page.
         * Prefer Bold/Black current-month digits over Regular/Light gray overflow days
         * (e.g. Feb 1 on the January page, or Jan 27 on the February page).
         */
        function findDayNumberOnPage(page, targetDay) {
            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            app.findGrepPreferences.findWhat = getExactDayGrep(targetDay);

            var previousIncludeMasterPages = null;
            try {
                previousIncludeMasterPages =
                    app.findChangeGrepOptions.includeMasterPages;
                app.findChangeGrepOptions.includeMasterPages = false;
            } catch (e) {}

            var frames = collectPageTextFrames(page);
            var best = null;
            var bestScore = -999999;
            var expectedLabel = getPageLabel(page);
            var headerBottom = getPageHeaderBottom(page);

            for (var f = 0; f < frames.length; f++) {
                var frame = frames[f];
                var results;

                try {
                    results = frame.findGrep();
                } catch (e) {
                    continue;
                }

                for (var i = 0; i < results.length; i++) {
                    var found = results[i];

                    try {
                        var foundPage = getFoundPage(found);
                        if (!isSamePage(foundPage, page)) continue;

                        if (expectedLabel && getPageLabel(foundPage) !== expectedLabel) {
                            continue;
                        }

                        var bounds = getTextBounds(found);
                        if (!bounds) continue;

                        // Ignore header/year digits and small sidebar numbers.
                        if (isInHeaderZone(bounds, headerBottom)) continue;
                        if (bounds.pointSize < minDayNumberPointSize) continue;

                        var gray = isGrayishText(found);
                        var weightScore = getFontWeightScore(found);
                        var score = bounds.pointSize + weightScore;

                        // Overflow days = gray + thin/regular. Current month = bold black/red.
                        if (gray) {
                            score -= 1000;
                        } else {
                            score += 200;
                        }

                        if (bounds.left < minDayNumberX) score -= 50;

                        if (score > bestScore) {
                            bestScore = score;
                            best = bounds;
                        }
                    } catch (e) {}
                }
            }

            app.findGrepPreferences = NothingEnum.nothing;
            app.changeGrepPreferences = NothingEnum.nothing;
            try {
                if (previousIncludeMasterPages !== null) {
                    app.findChangeGrepOptions.includeMasterPages =
                        previousIncludeMasterPages;
                }
            } catch (e) {}

            return best;
        }

        function placeGiftIcon(page, x, y) {
            var frame = page.rectangles.add(birthdayLayer, {
                geometricBounds: [y, x, y + iconSize, x + iconSize]
            });

            try {
                frame.strokeWeight = 0;
                frame.strokeColor = doc.swatches.itemByName("None");
                frame.fillColor = doc.swatches.itemByName("None");
            } catch (e) {}

            frame.place(giftIconFile);

            try {
                frame.fit(FitOptions.PROPORTIONALLY);
                frame.fit(FitOptions.CENTER_CONTENT);
            } catch (e) {}

            // fit() can shrink the frame — restore the intended anchor box.
            try {
                frame.geometricBounds = [y, x, y + iconSize, x + iconSize];
            } catch (e) {}

            try {
                frame.bringToFront();
            } catch (e) {}
            return frame;
        }

        function placeBirthdayNames(page, names, x, y, height) {
            var tf = page.textFrames.add(birthdayLayer, {
                geometricBounds: [y, x, y + height, x + textWidth]
            });

            var safeNames = [];

            for (var nameIndex = 0; nameIndex < names.length; nameIndex++) {
                safeNames.push(stringOrEmpty(names[nameIndex]));
            }

            tf.contents = safeNames.join("\r");

            try {
                tf.parentStory.appliedFont = app.fonts.itemByName(fontName + "\t" + fontStyle);
            } catch (e) {
                try {
                    tf.parentStory.appliedFont = app.fonts.itemByName(fontName + " " + fontStyle);
                } catch (_) {
                    try {
                        tf.parentStory.appliedFont = app.fonts.itemByName(fontName);
                    } catch (__) {}
                }
            }

            try {
                tf.parentStory.pointSize = fontSize;
                tf.parentStory.leading = fontSize * 1.15;
                tf.parentStory.fillColor = birthdayColor;
                tf.parentStory.justification = Justification.LEFT_ALIGN;
                tf.parentStory.capitalization = Capitalization.NORMAL;
            } catch (e) {}

            try {
                tf.textFramePreferences.verticalJustification = VerticalJustification.TOP_ALIGN;
            } catch (e) {}

            try {
                tf.textFramePreferences.autoSizingType = AutoSizingTypeEnum.OFF;
            } catch (e) {}

            try {
                tf.bringToFront();
            } catch (e) {}
            return tf;
        }

        function getGroupTextHeight(names) {
            var lineHeight = fontSize * 1.35;
            return Math.max(lineHeight * names.length + fontSize * 0.2, iconSize);
        }

        var inserted = 0;
        var failed = 0;
        var errors = [];

        for (var i = 0; i < birthdayGroups.length; i++) {
            var group = birthdayGroups[i];
            var page = getPageForMonth(group.month);

            if (!page) {
                failed += group.items.length;
                errors.push(
                    "Nenasiel som stranku month-" +
                        group.month +
                        " pre narodeniny " +
                        group.day +
                        "." +
                        group.month +
                        "."
                );
                continue;
            }

            // Ensure label is set before searching this page only.
            try {
                page.label = "month-" + group.month;
            } catch (e) {}

            var pageLabel = getPageLabel(page);
            var dayBounds = findDayNumberOnPage(page, group.day);

            if (!dayBounds) {
                failed += group.items.length;
                errors.push(
                    "Nenasiel som den " +
                        group.day +
                        "." +
                        group.month +
                        ". na stranke " +
                        pageLabel +
                        " (index " +
                        getPageId(page) +
                        "). Skontroluj, ci je cislo dna live text a nie outline/obrazok."
                );
                continue;
            }

            var createdIcon = null;
            var createdNameFrame = null;

            try {
                var names = [];

                for (var n = 0; n < group.items.length; n++) {
                    names.push(group.items[n].firstName);
                }

                var textHeight = getGroupTextHeight(names);

                // Horizontal: always after the day digit (stable for 1 vs 27).
                // Vertical: same top for 1, 2, or 3+ names — frame grows downward only.
                var blockTopY = dayBounds.baseline + offsetY;
                var iconX = dayBounds.right + offsetX;
                var iconY = blockTopY;
                var textX = iconX + iconSize + iconGap;
                var textY = blockTopY;

                createdIcon = placeGiftIcon(page, iconX, iconY);
                createdNameFrame = placeBirthdayNames(
                    page,
                    names,
                    textX,
                    textY,
                    textHeight
                );

                if (createdNameFrame.overflows) {
                    throw new Error(
                        "Text s menami sa nezmesti do birthday frame-u."
                    );
                }

                inserted += group.items.length;
            } catch (e) {
                removePageItems([createdNameFrame, createdIcon]);
                failed += group.items.length;
                errors.push(
                    "Chyba pri narodeninach " + group.day + "." + group.month + ".: " + e
                );
            }
        }

        return { inserted: inserted, failed: failed, errors: errors };
    }

    function groupBirthdaysByDate(birthdays) {
        var map = {};
        var groups = [];

        for (var i = 0; i < birthdays.length; i++) {
            var birthday = birthdays[i];
            var key = birthday.month + "-" + birthday.day;

            if (!map[key]) {
                map[key] = {
                    day: birthday.day,
                    month: birthday.month,
                    items: []
                };

                groups.push(map[key]);
            }

            map[key].items.push(birthday);
        }

        return groups;
    }

    function normalizeBirthdays(birthdays) {
        var result = [];

        for (var i = 0; i < birthdays.length; i++) {
            var item = birthdays[i];
            if (!item) continue;

            var day = Number(item.day);
            var month = Number(item.month);
            var fullName = trim(String(item.name || item.fullName || ""));
            var firstName = fullName.split(/\s+/)[0];

            if (!day || !month || !firstName) continue;
            if (day < 1 || day > 31) continue;
            if (month < 1 || month > 12) continue;

            result.push({
                day: day,
                month: month,
                fullName: fullName,
                firstName: toDisplayNameCase(firstName)
            });
        }

        return result;
    }

    function trim(value) {
        return String(value).replace(/^\s+|\s+$/g, "");
    }

    function toDisplayNameCase(value) {
        var name = trim(String(value || ""));
        if (!name) return "";

        var lower = name.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    function installAnnumAfterSaveListener() {
        try {
            if ($.global.annumAfterSaveHandler) {
                app.removeEventListener(
                    "afterSave",
                    $.global.annumAfterSaveHandler
                );
            }
        } catch (e) {}

        var handler = function (event) {
            var doc = null;

            try {
                if (
                    event.target &&
                    event.target.isValid &&
                    event.target.constructor &&
                    event.target.constructor.name === "Document"
                ) {
                    doc = event.target;
                }
            } catch (e) {}

            if (!doc) {
                try {
                    if (
                        event.parent &&
                        event.parent.isValid &&
                        event.parent.constructor &&
                        event.parent.constructor.name === "Document"
                    ) {
                        doc = event.parent;
                    }
                } catch (e) {}
            }

            if (!doc || !doc.isValid) {
                return;
            }

            try {
                if (doc.extractLabel("AnnumV26AutoPdfEnabled") !== "1") {
                    return;
                }

                var pdfPath = doc.extractLabel("AnnumV26AutoPdfPath");
                if (!pdfPath) {
                    throw new Error("Chyba cesta pre automaticky PDF export.");
                }

                var presetName =
                    doc.extractLabel("AnnumV26AutoPdfPreset") ||
                    "[High Quality Print]";
                var pdfFile = File(pdfPath);

                prepareDocumentForPdfExport(doc);
                exportPdf(doc, pdfFile, presetName);

                if (!pdfFile.exists) {
                    throw new Error("PDF subor po exporte neexistuje.");
                }

                if (!$.global.annumAutoPdfResults) {
                    $.global.annumAutoPdfResults = {};
                }
                $.global.annumAutoPdfResults[String(doc.id)] = {
                    status: "success",
                    error: ""
                };

                var logPath = doc.extractLabel("AnnumV26AutoPdfLogPath");
                if (logPath) {
                    var logFile = File(logPath);
                    logFile.encoding = "UTF-8";
                    if (logFile.open("a")) {
                        logFile.writeln(
                            "- PDF export (auto po ulozeni): " + pdfFile.fsName
                        );
                        logFile.close();
                    }
                }
            } catch (exportError) {
                var message = formatScriptError(exportError);
                if (!$.global.annumAutoPdfResults) {
                    $.global.annumAutoPdfResults = {};
                }
                $.global.annumAutoPdfResults[String(doc.id)] = {
                    status: "error",
                    error: message
                };
                alertAscii("Automaticky PDF export zlyhal:\n" + message);
            }
        };

        app.addEventListener("afterSave", handler);
        $.global.annumAfterSaveHandler = handler;
    }
})();
