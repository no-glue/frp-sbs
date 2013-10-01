$(function() {
    var validAlbum, validArtist, validYear, validGenre;

    var renderRecords = function(records) {
        var items = _.reduce(records, function(acc, record) {
            return acc + "<li>" +
                "<h3>" + record.album + "</h3>" +
                "<p> Artist: " + record.artist + "</p>" +
                "<p>Year: " + record.year + "</p>" +
                "<p>Genre: " + record.genre + "</p>" +
                "</li>";
        }, "");
        $("#records ul").html(items);
    };

    var filterRecords = function(records, recordFilter) {
        return _.filter(records, function(record) {
            return _(record).values().any(function(v) {
                return recordFilter.test(v);
            });
        });
    };

    var recordsRequest = Bacon.fromPromise($.ajax("/records"));
    recordsRequest.onEnd(function() {
        $("#records .loader").hide();
    });
    recordsRequest.onError(function() {
        $("#records .error").show({duration: 400});
    });

    var records = recordsRequest.toProperty([]);

    var recordFilter = Bacon.fromEventTarget($("#filter"), "keyup")
        .map(function(event) {
            return event.currentTarget.value;
        })
        .toProperty("")
        .map(function(val) {
            return new RegExp(val, "i");
        });

    var filteredRecords = records
        .combine(recordFilter, filterRecords)
        .onValue(renderRecords);

    $("#album").on("keyup", function() {
        var value = $(this).val();
        if (!value) {
            $("#album + i").attr("class", "icon-asterisk");
            validAlbum = false;
        } else if (_.any(records, {"album": value})) {
            $("#album + i").attr("class", "icon-warning-sign");
            validAlbum = false;
        } else {
            $("#album + i").attr("class", "icon-ok");
            validAlbum = true;
        }
    });

    $("#artist").on("keyup", function() {
        var value = $(this).val();
        if (!value) {
            $("#artist + i").attr("class", "icon-asterisk");
            validArtist = false;
        } else {
            $("#artist + i").attr("class", "icon-ok");
            validArtist = true;
        }
    });

    $("#year").on("keyup", function() {
        var value = $(this).val();
        if (!value) {
            $("#year + i").attr("class", "icon-asterisk");
            validYear = false;
        } else if (/^\d{4}$/.test(value)) {
            $("#year + i").attr("class", "icon-ok");
            validYear = true;
        } else {
            $("#year + i").attr("class", "icon-warning-sign");
            validYear = false;
        }
    });

    $("#genre").on("keyup", function() {
        var value = $(this).val();
        if (!value) {
            $("#genre + i").attr("class", "icon-asterisk");
            validGenre = false;
        } else {
            $("#genre + i").attr("class", "icon-ok");
            validGenre = true;
        }
    });

    $("input").on("keyup", function() {
        $("[type=submit]").attr("disabled", !(validAlbum && validArtist && validYear && validGenre));
    });

    $("[type=submit]").on("click", function(event) {
        event.preventDefault();
        $(this).append("<div class='loader-small'></div>");
        $.ajax({
            url: "/records/new",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                "album": $("#album").val(),
                "artist": $("#artist").val(),
                "year": $("#year").val(),
                "genre": $("#genre").val(),
            })})
            .done(function(data) {
                records.push(data);
                $("input").val("").trigger("keyup");
                renderRecords(records);
            })
            .fail(function() {
                $(".pure-form .error").show({duration: 400}).delay(3000).hide({duration: 400});
            })
            .always(function() {
                $(".loader-small").remove();
            });
    });
});